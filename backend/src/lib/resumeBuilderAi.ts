import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { GeminiError } from './gemini.js';
import type {
  GenerateSummaryInput,
  GenerateSummaryResult,
  GenerateBulletsInput,
  GenerateBulletsResult,
  SuggestSkillsInput,
  SuggestSkillsResult,
  ImproveProjectInput,
  ImproveProjectResult,
  CompleteResumeDraftInput,
  CompleteResumeDraftResult,
  TailorResumeInput,
  TailorResumeResult,
} from '../types/resumeIntelligence.js';

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!config.geminiApiKey) {
    throw new GeminiError(
      'AI service is not configured yet. Set GEMINI_API_KEY in server/.env and restart the server.',
    );
  }
  if (!client) client = new GoogleGenerativeAI(config.geminiApiKey);
  return client;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenceMatch ? fenceMatch[1] : trimmed).trim();
}

const MAX_OVERLOAD_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiJson<T>(prompt: string, schema: object): Promise<T> {
  const model = getClient().getGenerativeModel({
    model: config.geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema as never,
    },
  });

  let responseText: string | undefined;
  let lastMessage = '';

  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([{ text: prompt }]);
      responseText = result.response.text();
      break;
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : String(err);
      console.error(`Gemini Intelligence error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
      const isOverloaded = /503|unavailable|overloaded|high demand/i.test(lastMessage);
      if (isOverloaded && attempt < MAX_OVERLOAD_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      if (/quota|rate limit|429/i.test(lastMessage)) {
        throw new GeminiError('The AI service is temporarily rate-limited. Please try again in a moment.');
      }
      if (/api key|permission|401|403/i.test(lastMessage)) {
        throw new GeminiError('The AI service rejected the request. Check the server GEMINI_API_KEY configuration.');
      }
      if (isOverloaded) {
        throw new GeminiError('The AI service is experiencing high demand right now. Please try again in a moment.');
      }
      throw new GeminiError('Could not reach the AI service. Please try again.');
    }
  }

  if (responseText === undefined) {
    throw new GeminiError('Could not reach the AI service. Please try again.');
  }

  try {
    return JSON.parse(extractJsonText(responseText)) as T;
  } catch {
    throw new GeminiError('The AI returned a response that could not be parsed. Please try again.');
  }
}

// ----------------- SUMMARY GENERATION -----------------

const summarySchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    alternativeOptions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    highlightedKeywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['summary', 'alternativeOptions', 'highlightedKeywords'],
};

export async function generateResumeSummary(input: GenerateSummaryInput): Promise<GenerateSummaryResult> {
  const prompt = `You are a top-tier technical resume strategist and former engineering recruiter.
Generate a high-impact, professional resume summary (3-4 concise, impactful sentences) targeted for ATS and recruiter screening.

CRITICAL RULES:
1. NEVER invent fake companies, metrics, years of experience, or claims not grounded in the provided facts.
2. Ground all claims in the user's provided skills, background, and education.
3. If target role or job description is provided, naturally weave in genuine keywords.
4. Output primary summary, 2 distinct alternatives (e.g. one more technical, one more leadership/impact focused), and relevant keywords highlighted.

INPUT DATA:
- Target Role: ${input.targetRole || 'Not specified'}
- Experience Level: ${input.experienceLevel || 'fresher/student/junior'}
- Background: ${input.background || 'None provided'}
- Key Skills: ${input.skills?.join(', ') || 'None provided'}
- Education: ${input.education?.join(', ') || 'None provided'}
- Existing Draft/Summary: ${input.existingSummary || 'None provided'}
${input.jobDescription ? `\nTarget Job Description:\n"""\n${input.jobDescription.slice(0, 3000)}\n"""` : ''}
`;

  return callGeminiJson<GenerateSummaryResult>(prompt, summarySchema);
}

// ----------------- BULLET POINTS GENERATION -----------------

const bulletsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    bullets: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          original: { type: SchemaType.STRING },
          bullet: { type: SchemaType.STRING },
          actionVerb: { type: SchemaType.STRING },
          measurableImpact: { type: SchemaType.STRING },
        },
        required: ['bullet', 'actionVerb'],
      },
    },
    feedback: { type: SchemaType.STRING },
  },
  required: ['bullets', 'feedback'],
};

export async function generateResumeBullets(input: GenerateBulletsInput): Promise<GenerateBulletsResult> {
  const prompt = `You are an expert ATS resume reviewer and technical writing coach.
Transform the provided project or work experience details into 3-5 high-impact resume bullet points.

CRITICAL INSTRUCTIONS:
1. Follow the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]" or "[Strong Action Verb] [Core Task/Architecture] using [Technologies], resulting in [Concrete Outcome/Efficiency/Functionality]".
2. DO NOT invent arbitrary fake statistics (e.g., do not invent "increased revenue by 94.2%" if not indicated by user). Use realistic, concrete indicators (e.g., "ensuring sub-100ms response times", "supporting 50+ concurrent socket connections", "reducing bundle size").
3. Highlight specific technologies and clean architectural decisions.
4. Every bullet MUST start with a strong active verb (e.g., Architected, Engineered, Implemented, Streamlined, Spearheaded).

INPUT:
- Type: ${input.type}
- Title / Role: ${input.titleOrRole}
- Organization/Company: ${input.organization || 'Personal Project'}
- Tech Stack: ${input.techStack?.join(', ') || 'Not specified'}
- Target Role: ${input.targetRole || 'General Engineering'}
- User Raw Input / Draft:
"""
${Array.isArray(input.rawDetails) ? input.rawDetails.join('\n') : input.rawDetails}
"""
${input.jobDescription ? `\nJob Description:\n"""\n${input.jobDescription.slice(0, 2000)}\n"""` : ''}
`;

  return callGeminiJson<GenerateBulletsResult>(prompt, bulletsSchema);
}

// ----------------- SKILLS SUGGESTION -----------------

const skillsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    toolsAndFrameworks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    softSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingCrucialSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['technical', 'toolsAndFrameworks', 'softSkills', 'missingCrucialSkills'],
};

export async function suggestResumeSkills(input: SuggestSkillsInput): Promise<SuggestSkillsResult> {
  const prompt = `You are a technical career coach.
Analyze the target role, job description, and the user's existing technical projects to recommend an organized, ATS-aligned skills section.

RULES:
1. Separate into 'technical' (languages, core CS concepts), 'toolsAndFrameworks' (libraries, cloud, dev tools), and 'softSkills' (workplace competencies).
2. Identify 'missingCrucialSkills': standard industry expectations for this target role that the user might want to study or add if they know them.
3. Keep skill names clean, industry-standard, and concise (e.g., "React", "TypeScript", "PostgreSQL", not verbose sentences).

INPUT:
- Target Role: ${input.targetRole || 'Software Engineer'}
- Experience Level: ${input.experienceLevel || 'student/junior'}
- Existing Skills Listed: ${input.existingSkills?.join(', ') || 'None'}
- Projects/Context: ${input.currentProjects?.join(' | ') || 'None provided'}
${input.jobDescription ? `\nTarget Job Description:\n"""\n${input.jobDescription.slice(0, 3000)}\n"""` : ''}
`;

  return callGeminiJson<SuggestSkillsResult>(prompt, skillsSchema);
}

// ----------------- PROJECT IMPROVEMENT -----------------

const projectImproveSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    refinedTechStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingInformation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['title', 'refinedTechStack', 'bullets', 'missingInformation'],
};

export async function improveResumeProject(input: ImproveProjectInput): Promise<ImproveProjectResult> {
  const prompt = `You are a senior tech lead reviewing a candidate's project for a resume.
Refine the project title, technologies, and bullet points to demonstrate engineering maturity and technical depth.

RULES:
1. DO NOT invent false features that the user never mentioned. If key information is missing (such as testing, deployment, database design, metrics), add it to 'missingInformation' so the user can supply it.
2. Formulate 3-4 crisp bullet points highlighting architecture, implementation, and practical outcome.
3. Clean up the tech stack into canonical tags.

INPUT:
- Title: ${input.title}
- Role on project: ${input.role || 'Developer'}
- Technologies: ${input.techStack?.join(', ') || 'Not specified'}
- Target Role: ${input.targetRole || 'Software Engineer'}
- Raw Description / Existing Bullets:
"""
${input.rawDescription || input.existingBullets?.join('\n') || ''}
"""
${input.jobDescription ? `\nJob Description:\n"""\n${input.jobDescription.slice(0, 2000)}\n"""` : ''}
`;

  return callGeminiJson<ImproveProjectResult>(prompt, projectImproveSchema);
}

// ----------------- COMPLETE RESUME DRAFT -----------------

const completeDraftSchema = {
  type: SchemaType.OBJECT,
  properties: {
    professionalSummary: { type: SchemaType.STRING },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        soft: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['technical', 'tools', 'soft'],
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['title', 'techStack', 'bullets'],
      },
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['company', 'role', 'bullets'],
      },
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          institution: { type: SchemaType.STRING },
          degree: { type: SchemaType.STRING },
          fieldOfStudy: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          scoreOrGpa: { type: SchemaType.STRING },
        },
        required: ['institution', 'degree'],
      },
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          issuer: { type: SchemaType.STRING },
          issueDate: { type: SchemaType.STRING },
        },
        required: ['name'],
      },
    },
    achievements: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
        },
        required: ['title'],
      },
    },
    missingInformation: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    'professionalSummary',
    'skills',
    'projects',
    'experience',
    'education',
    'certifications',
    'achievements',
    'missingInformation',
  ],
};

export async function generateCompleteResumeDraft(input: CompleteResumeDraftInput): Promise<CompleteResumeDraftResult> {
  const prompt = `You are a master technical resume builder and ATS optimization engineer.
Take the user's raw, unpolished background details and generate a complete, coherent, production-ready ATS resume draft.

ABSOLUTE INTEGRITY CONSTRAINTS:
1. NEVER invent fake employers, universities, dates, fake certifications, or unverified claims.
2. If the user omitted crucial information (e.g. project links, metrics, GitHub profile, degree end dates), list them in 'missingInformation'.
3. Turn rough project descriptions into strong accomplishment bullets with active verbs.
4. Categorize skills into technical, tools, and soft skills.
5. Create an engaging 3-sentence summary tailored to their target role.

USER RAW DATA:
${JSON.stringify(input, null, 2)}
`;

  return callGeminiJson<CompleteResumeDraftResult>(prompt, completeDraftSchema);
}

// ----------------- RESUME TAILORING -----------------

const tailorSchema = {
  type: SchemaType.OBJECT,
  properties: {
    matchScore: { type: SchemaType.NUMBER },
    matchedKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestedSkillAdditions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    rewrittenSummary: { type: SchemaType.STRING },
    rewrittenProjects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['title', 'bullets'],
      },
    },
    rewrittenExperience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['company', 'role', 'bullets'],
      },
    },
    sectionsToEmphasize: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    sectionsToReduceOrRemove: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: [
    'matchScore',
    'matchedKeywords',
    'missingKeywords',
    'suggestedSkillAdditions',
    'rewrittenSummary',
    'rewrittenProjects',
    'rewrittenExperience',
    'sectionsToEmphasize',
    'sectionsToReduceOrRemove',
  ],
};

export async function tailorResumeToJob(input: TailorResumeInput): Promise<TailorResumeResult> {
  const prompt = `You are an executive ATS calibration specialist.
Compare the user's existing resume against the specified Job Description.

OBJECTIVES:
1. Calculate a realistic 'matchScore' (0-100) based on requirements overlap.
2. List 'matchedKeywords' and critical 'missingKeywords'.
3. Rewrite the Professional Summary and Bullet points to organically emphasize relevant aspects of what the user ALREADY did, highlighting terminology from the Job Description without fabricating false experience.
4. Specify 'sectionsToEmphasize' and 'sectionsToReduceOrRemove'.

TARGET ROLE: ${input.targetRole || 'Not specified'}

JOB DESCRIPTION:
"""
${input.jobDescription.slice(0, 5000)}
"""

EXISTING USER RESUME:
${JSON.stringify(input.resume, null, 2)}
`;

  return callGeminiJson<TailorResumeResult>(prompt, tailorSchema);
}
