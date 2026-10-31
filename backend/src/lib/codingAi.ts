import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { GeminiError } from './gemini.js';
import type { GenerateDraftInput, SupportedCodingLanguage, ProblemDifficulty } from '../types/coding.js';

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!config.geminiApiKey) {
    throw new GeminiError(
      'AI service is not configured yet. Set GEMINI_API_KEY in server/.env and restart the server.'
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
      console.error(`Gemini Coding Draft Generator error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
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
    throw new GeminiError('The AI returned a response that could not be parsed as valid JSON. Please try again.');
  }
}

export interface GeneratedQuestionDraftResult {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  topic: string;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  executionLimits: {
    timeLimitMs: number;
    memoryLimitMb: number;
  };
  checkerPolicy: {
    type: 'exact' | 'token' | 'lines';
    ignoreTrailingWhitespace: boolean;
    trimNewlines: boolean;
    caseSensitive: boolean;
  };
  starterCodeByLanguage: {
    cpp: string;
    java: string;
    python: string;
  };
  sampleTestCases: Array<{
    input: string;
    expectedOutput: string;
    explanation: string;
  }>;
  hiddenTestCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  referenceSolutions: Array<{
    language: SupportedCodingLanguage;
    solutionCode: string;
    approachExplanation: string;
    timeComplexity: string;
    spaceComplexity: string;
  }>;
  progressiveHints: Array<{
    step: number;
    title: string;
    content: string;
  }>;
  editorial: string;
}

const draftQuestionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    slug: { type: SchemaType.STRING },
    difficulty: { type: SchemaType.STRING, enum: ['easy', 'medium', 'hard'] },
    topic: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    statement: { type: SchemaType.STRING },
    inputFormat: { type: SchemaType.STRING },
    outputFormat: { type: SchemaType.STRING },
    constraints: { type: SchemaType.STRING },
    executionLimits: {
      type: SchemaType.OBJECT,
      properties: {
        timeLimitMs: { type: SchemaType.INTEGER },
        memoryLimitMb: { type: SchemaType.INTEGER },
      },
      required: ['timeLimitMs', 'memoryLimitMb'],
    },
    checkerPolicy: {
      type: SchemaType.OBJECT,
      properties: {
        type: { type: SchemaType.STRING, enum: ['exact', 'token', 'lines'] },
        ignoreTrailingWhitespace: { type: SchemaType.BOOLEAN },
        trimNewlines: { type: SchemaType.BOOLEAN },
        caseSensitive: { type: SchemaType.BOOLEAN },
      },
      required: ['type', 'ignoreTrailingWhitespace', 'trimNewlines', 'caseSensitive'],
    },
    starterCodeByLanguage: {
      type: SchemaType.OBJECT,
      properties: {
        cpp: { type: SchemaType.STRING },
        java: { type: SchemaType.STRING },
        python: { type: SchemaType.STRING },
      },
      required: ['cpp', 'java', 'python'],
    },
    sampleTestCases: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          input: { type: SchemaType.STRING },
          expectedOutput: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['input', 'expectedOutput', 'explanation'],
      },
    },
    hiddenTestCases: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          input: { type: SchemaType.STRING },
          expectedOutput: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['input', 'expectedOutput'],
      },
    },
    referenceSolutions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          language: { type: SchemaType.STRING, enum: ['cpp', 'java', 'python'] },
          solutionCode: { type: SchemaType.STRING },
          approachExplanation: { type: SchemaType.STRING },
          timeComplexity: { type: SchemaType.STRING },
          spaceComplexity: { type: SchemaType.STRING },
        },
        required: ['language', 'solutionCode', 'approachExplanation', 'timeComplexity', 'spaceComplexity'],
      },
    },
    progressiveHints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.INTEGER },
          title: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
        },
        required: ['step', 'title', 'content'],
      },
    },
    editorial: { type: SchemaType.STRING },
  },
  required: [
    'title',
    'slug',
    'difficulty',
    'topic',
    'tags',
    'statement',
    'inputFormat',
    'outputFormat',
    'constraints',
    'executionLimits',
    'checkerPolicy',
    'starterCodeByLanguage',
    'sampleTestCases',
    'hiddenTestCases',
    'referenceSolutions',
    'progressiveHints',
    'editorial',
  ],
};

export async function generateCodingQuestionDraft(input: GenerateDraftInput): Promise<GeneratedQuestionDraftResult> {
  const prompt = `You are a competitive programming problem author and computer science instructor for Cadence.
Generate a fresh, original, pedagogical full-program (stdin/stdout) coding problem.

REQUIREMENTS:
1. Topic: ${input.topic}
${input.subtopic ? `2. Subtopic: ${input.subtopic}` : ''}
3. Difficulty: ${input.difficulty}
${input.targetAudience ? `4. Target Audience: ${input.targetAudience}` : ''}
${input.additionalConstraints ? `5. Additional Constraints: ${input.additionalConstraints}` : ''}

CRITICAL PROBLEM SPECIFICATION RULES:
- The problem MUST be an original, cleanly specified competitive programming problem.
- Standard I/O (stdin/stdout) ONLY. No interactive or file-based protocols.
- Include a URL-safe lowercase slug (e.g. "two-sum-closest", "maximum-subarray-xor").
- Input format must explicitly explain the sequence of tokens/lines read from stdin.
- Output format must explicitly explain the exact output printed to stdout including newlines.
- Constraints must be mathematically rigorous (e.g., "1 <= N <= 10^5", "-10^9 <= A[i] <= 10^9").
- Starter code must be scaffolding only (NOT completed solutions).
  * For C++: includes <iostream>, using namespace std;, int main() reading input and TODO comment.
  * For Java: class Main { public static void main(String[] args) { ... } } reading from Scanner/BufferedReader.
  * For Python: standard reading from sys.stdin or input() with TODO.
- Test cases:
  * Provide at least 2 clear sampleTestCases with detailed explanations.
  * Provide at least 3 hiddenTestCases covering edge cases (min constraints, max constraints, duplicates, zeroes, negatives).
- Reference solutions:
  * Provide complete, optimal solutions in all 3 languages: cpp, java, and python.
  * Ensure Java class name is Main.
- Progressive hints:
  * Provide 3 sequential hints from high-level observation to algorithm direction.
- Editorial:
  * In-depth explanation of the approach, proof of correctness, and complexity analysis.
`;

  return callGeminiJson<GeneratedQuestionDraftResult>(prompt, draftQuestionSchema);
}

