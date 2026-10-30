import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { GeminiError } from './gemini.js';
import type { ResumeEnhanceInput, ResumeEnhanceResult } from '../types/resume.js';

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!config.geminiApiKey) {
    throw new GeminiError(
      'Resume enhancement is not configured yet. Set GEMINI_API_KEY in server/.env and restart the server.',
    );
  }
  if (!client) client = new GoogleGenerativeAI(config.geminiApiKey);
  return client;
}

const enhanceSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['title', 'bullets'],
      },
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['company', 'role', 'bullets'],
      },
    },
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
};

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

export async function enhanceResumeContent(input: ResumeEnhanceInput): Promise<ResumeEnhanceResult> {
  const model = getClient().getGenerativeModel({
    model: config.geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: enhanceSchema as never,
    },
  });

  const prompt = `You are an expert ATS resume reviewer and career coach.
Your task is to refine and improve the user's provided resume content to make it impactful, ATS-friendly, professional, and results-oriented.

CRITICAL RULES:
1. DO NOT invent fake experience, fake companies, fake degrees, fake certifications, or fake quantified metrics that are completely made up.
2. Polish the user's existing points using strong active verbs, clear phrasing, and industry-standard technical phrasing.
3. If a target role or job description is provided, highlight keywords and phrasing naturally relevant to that role without fabricating qualifications.
4. If a specific section is requested (${input.section || 'all'}), focus enhancements on that section, but return clean matching structures.
5. Provide bullet points in concise, bullet-style accomplishment statements (e.g., "Engineered X using Y, optimizing Z...").

INPUT DETAILS:
${input.targetRole ? `Target Role: "${input.targetRole}"` : ''}
${input.jobDescription ? `Job Description: """\n${input.jobDescription.slice(0, 4000)}\n"""` : ''}
${input.section ? `Requested Focus Section: "${input.section}"` : ''}

USER RESUME CONTENT:
${JSON.stringify(input.content, null, 2)}

Return a JSON object conforming strictly to the schema with:
- summary: Enhanced professional summary (or user summary improved)
- projects: Array of projects with improved title and bullets
- experience: Array of experiences with company, role, and improved bullets
- skills: Array of refined, organized skills
`;

  let responseText: string | undefined;
  let lastMessage = '';

  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([{ text: prompt }]);
      responseText = result.response.text();
      break;
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : String(err);
      console.error(`Gemini resume enhance error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
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
    const parsed = JSON.parse(extractJsonText(responseText)) as ResumeEnhanceResult;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : undefined,
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.map((p) => ({
            title: String(p.title || ''),
            bullets: Array.isArray(p.bullets) ? p.bullets.map(String).filter((b) => b.trim().length > 0) : [],
          }))
        : undefined,
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map((e) => ({
            company: String(e.company || ''),
            role: String(e.role || ''),
            bullets: Array.isArray(e.bullets) ? e.bullets.map(String).filter((b) => b.trim().length > 0) : [],
          }))
        : undefined,
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).filter((s) => s.trim().length > 0) : undefined,
    };
  } catch {
    throw new GeminiError('The AI returned a response that could not be parsed. Please try again.');
  }
}
