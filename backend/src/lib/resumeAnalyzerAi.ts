import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { GeminiError } from './gemini.js';
import type {
  FullResumeAnalysis,
  ImproveAnalysisInput,
  ImproveAnalysisResult,
  ResumeInterviewQuestions,
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
      console.error(`Gemini Analyzer error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
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

// ----------------- FULL RESUME ANALYSIS SCHEMA -----------------

const fullAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scores: {
      type: SchemaType.OBJECT,
      properties: {
        overall: { type: SchemaType.NUMBER },
        ats: { type: SchemaType.NUMBER },
        roleMatch: { type: SchemaType.NUMBER },
        recruiterImpression: { type: SchemaType.NUMBER },
        sections: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.NUMBER },
            education: { type: SchemaType.NUMBER },
            skills: { type: SchemaType.NUMBER },
            projects: { type: SchemaType.NUMBER },
            experience: { type: SchemaType.NUMBER },
            certifications: { type: SchemaType.NUMBER },
            achievements: { type: SchemaType.NUMBER },
            formatting: { type: SchemaType.NUMBER },
            keywords: { type: SchemaType.NUMBER },
            credibility: { type: SchemaType.NUMBER },
          },
          required: [
            'summary',
            'education',
            'skills',
            'projects',
            'experience',
            'certifications',
            'achievements',
            'formatting',
            'keywords',
            'credibility',
          ],
        },
      },
      required: ['overall', 'ats', 'roleMatch', 'recruiterImpression', 'sections'],
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          sectionToHighlight: { type: SchemaType.STRING },
        },
        required: ['title', 'explanation', 'sectionToHighlight'],
      },
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: { type: SchemaType.STRING, format: 'enum', enum: ['low', 'medium', 'high', 'critical'] },
          section: { type: SchemaType.STRING },
          snippet: { type: SchemaType.STRING },
          problem: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
          fix: { type: SchemaType.STRING },
          improved: { type: SchemaType.STRING },
        },
        required: ['severity', 'section', 'problem', 'impact', 'fix'],
      },
    },
    missingKeywords: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          keyword: { type: SchemaType.STRING },
          category: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['technical', 'tool', 'concept', 'soft-skill'],
          },
          relevance: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['critical', 'recommended', 'optional'],
          },
          context: { type: SchemaType.STRING },
        },
        required: ['keyword', 'category', 'relevance', 'context'],
      },
    },
    weakBullets: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          original: { type: SchemaType.STRING },
          problemType: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: [
              'no-action-verb',
              'no-impact',
              'too-generic',
              'too-long',
              'unclear-tech-stack',
              'no-measurable-result',
            ],
          },
          severity: { type: SchemaType.STRING, format: 'enum', enum: ['low', 'medium', 'high', 'critical'] },
          improved: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['original', 'problemType', 'severity', 'improved', 'explanation'],
      },
    },
    formattingIssues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          issue: { type: SchemaType.STRING },
          riskLevel: { type: SchemaType.STRING, format: 'enum', enum: ['low', 'medium', 'high'] },
          recommendation: { type: SchemaType.STRING },
        },
        required: ['issue', 'riskLevel', 'recommendation'],
      },
    },
    credibilityChecks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          claim: { type: SchemaType.STRING },
          concern: { type: SchemaType.STRING },
          status: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['verificationRecommended', 'wellSupported', 'unclearTechStack'],
          },
          recommendation: { type: SchemaType.STRING },
        },
        required: ['claim', 'concern', 'status', 'recommendation'],
      },
    },
    redFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    prioritizedActions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          priority: { type: SchemaType.STRING, format: 'enum', enum: ['P0', 'P1', 'P2'] },
          estimatedImpact: { type: SchemaType.STRING },
          section: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
          beforeExample: { type: SchemaType.STRING },
          afterExample: { type: SchemaType.STRING },
        },
        required: ['priority', 'estimatedImpact', 'section', 'action', 'beforeExample', 'afterExample'],
      },
    },
    rewrittenContent: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
        skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        achievements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    interviewQuestions: {
      type: SchemaType.OBJECT,
      properties: {
        technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        projectBased: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        hr: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['technical', 'projectBased', 'hr'],
    },
    explanations: {
      type: SchemaType.OBJECT,
      properties: {
        language: { type: SchemaType.STRING, format: 'enum', enum: ['english', 'hinglish'] },
        overallFeedback: { type: SchemaType.STRING },
      },
      required: ['language', 'overallFeedback'],
    },
  },
  required: [
    'scores',
    'strengths',
    'weaknesses',
    'missingKeywords',
    'weakBullets',
    'formattingIssues',
    'credibilityChecks',
    'redFlags',
    'prioritizedActions',
    'rewrittenContent',
    'interviewQuestions',
    'explanations',
  ],
};

export async function performDeepResumeAnalysis(params: {
  resumeText: string;
  targetRole?: string;
  jobDescription?: string;
  experienceLevel?: string;
  language?: 'english' | 'hinglish';
}): Promise<FullResumeAnalysis> {
  const lang = params.language === 'hinglish' ? 'hinglish' : 'english';

  const prompt = `You are a Principal Technical Recruiter and ATS Algorithms Auditor.
Perform an exhaustive, deep architectural audit of the provided resume text.

PARAMETERS:
- Target Role: "${params.targetRole || 'Software Engineering / Tech Professional'}"
- Candidate Level: "${params.experienceLevel || 'student/fresher/junior'}"
- Explanation Language: "${lang}" (If hinglish, write helpful explanations and feedback in friendly conversational Hinglish e.g. "Aapka project section kaafi solid hai, par measurable outcomes add karne honge").

AUDIT CRITERIA & RULES:
1. SCORES (0-100):
   - overall, ats, roleMatch, recruiterImpression, and section-by-section breakdown.
   - If no target role/JD is provided, calculate roleMatch against general modern software engineering benchmarks.
2. STRENGTHS:
   - Identify standout elements and explain why recruiters will like them.
3. WEAKNESSES:
   - Detail severity (low/medium/high/critical), exact problem, candidate impact, and concrete fix.
4. MISSING KEYWORDS:
   - Extract industry-critical tech keywords missing from this profile.
5. WEAK BULLET-POINT DETECTION:
   - Locate passive, generic, or metric-less bullets and provide high-impact rewrites adhering to Google X-Y-Z formula.
6. FORMATTING & ATS ISSUES:
   - Detect non-standard headers, missing links, date inconsistencies, layout risks.
7. CREDIBILITY & CONSISTENCY:
   - Flag unsupported claims, buzzword-stuffing, skill-project mismatches without accusing the user. Use status: 'verificationRecommended'.
8. RED FLAGS:
   - Identify critical deficiencies (e.g. no projects for a fresher, missing contact links, generic fluff).
9. PRIORITIZED ACTIONS:
   - Numbered P0/P1/P2 actions with before/after snippets for immediate score boost.
10. REWRITTEN CONTENT:
   - Provide an improved summary and refined skills based strictly on facts present in the text.
11. INTERVIEW QUESTIONS:
   - Generate top technical, project deep-dive, and behavioral HR questions based on the candidate's actual projects.

RESUME TEXT:
"""
${params.resumeText.slice(0, 45000)}
"""

${
  params.jobDescription
    ? `TARGET JOB DESCRIPTION:\n"""\n${params.jobDescription.slice(0, 6000)}\n"""`
    : ''
}
`;

  return callGeminiJson<FullResumeAnalysis>(prompt, fullAnalysisSchema);
}

// ----------------- ANALYSIS IMPROVEMENT GENERATION -----------------

const improveAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    rewrittenSummary: { type: SchemaType.STRING },
    rewrittenProjectBullets: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          projectTitle: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['bullets'],
      },
    },
    rewrittenExperienceBullets: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['bullets'],
      },
    },
    suggestedSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestedAchievements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    explanation: {
      type: SchemaType.OBJECT,
      properties: {
        strategy: { type: SchemaType.STRING },
        keyChanges: { type: SchemaType.STRING },
      },
      required: ['strategy', 'keyChanges'],
    },
    itemsToVerify: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['explanation', 'itemsToVerify'],
};

export async function generateImprovedResumeFromAnalysis(params: {
  resumeText: string;
  analysis: FullResumeAnalysis;
  input: ImproveAnalysisInput;
}): Promise<ImproveAnalysisResult> {
  const prompt = `You are an elite career strategist.
Using the stored resume text and previous audit analysis, produce a ready-to-paste improved version of the requested sections (${params.input.focus || 'all'}).

STRICT INTEGRITY:
- Rewrite based ONLY on what the user actually built and achieved.
- Do NOT fabricate companies, degrees, tools, or metrics.
- Return 'itemsToVerify' for any numbers or details the user should personalize.

TARGET ROLE: ${params.input.targetRole || 'Software Engineer'}
FOCUS SECTION: ${params.input.focus || 'all'}
EXPLANATION LANGUAGE: ${params.input.language || 'english'}
${params.input.jobDescription ? `JOB DESCRIPTION:\n"""\n${params.input.jobDescription.slice(0, 3000)}\n"""` : ''}

ORIGINAL RESUME TEXT:
"""
${params.resumeText.slice(0, 25000)}
"""

KEY AUDIT WEAKNESSES TO REMEDY:
${JSON.stringify(params.analysis.weaknesses.slice(0, 6), null, 2)}
`;

  return callGeminiJson<ImproveAnalysisResult>(prompt, improveAnalysisSchema);
}

// ----------------- INTERVIEW PREP GENERATOR -----------------

const interviewPrepSchema = {
  type: SchemaType.OBJECT,
  properties: {
    technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    projectBased: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    hr: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['technical', 'projectBased', 'hr'],
};

export async function generateInterviewQuestionsFromResume(
  resumeText: string,
  targetRole?: string
): Promise<ResumeInterviewQuestions> {
  const prompt = `You are a senior engineering hiring manager conducting technical and behavioral interviews.
Review the candidate's resume and generate 12-15 highly targeted interview questions categorized into:
1. Technical questions probing the tools/languages listed
2. Project-based deep dives (e.g. "In your project X, how did you handle edge cases and state management?")
3. HR / Behavioral questions (e.g. teamwork, delivery under deadlines)

TARGET ROLE: ${targetRole || 'Software Engineer'}

RESUME TEXT:
"""
${resumeText.slice(0, 25000)}
"""
`;

  return callGeminiJson<ResumeInterviewQuestions>(prompt, interviewPrepSchema);
}
