import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { GeminiError } from './gemini.js';
import type {
  AnalyzeCodeInput,
  GeminiDebugAnalysisResult,
  ExplainCodeInput,
  ExplainCodeResult,
  DryRunOnlyInput,
  DryRunOnlyResult,
} from '../types/debugger.js';

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
      console.error(`Gemini Debugger error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
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

const debugAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    language: {
      type: SchemaType.STRING,
      enum: ['c', 'cpp', 'java', 'python', 'javascript'],
    },
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            enum: ['syntax', 'logic', 'runtime', 'performance', 'style', 'security'],
          },
          severity: {
            type: SchemaType.STRING,
            enum: ['low', 'medium', 'high', 'critical'],
          },
          line: { type: SchemaType.INTEGER },
          snippet: { type: SchemaType.STRING },
          message: { type: SchemaType.STRING },
          why: { type: SchemaType.STRING },
          fix: { type: SchemaType.STRING },
          correctedSnippet: { type: SchemaType.STRING },
        },
        required: ['type', 'severity', 'line', 'snippet', 'message', 'why', 'fix', 'correctedSnippet'],
      },
    },
    correctedCode: { type: SchemaType.STRING },
    lineByLineExplanation: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          line: { type: SchemaType.INTEGER },
          explanation: { type: SchemaType.STRING },
        },
        required: ['line', 'explanation'],
      },
    },
    dryRun: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.INTEGER },
          line: { type: SchemaType.INTEGER },
          event: {
            type: SchemaType.STRING,
            enum: ['assignment', 'condition', 'loop-iteration', 'function-call', 'return', 'output', 'error'],
          },
          description: { type: SchemaType.STRING },
          variables: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING },
                scope: { type: SchemaType.STRING },
              },
              required: ['name', 'value', 'type', 'scope'],
            },
          },
          callStack: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          output: { type: SchemaType.STRING },
          isErrorStep: { type: SchemaType.BOOLEAN },
          errorMessage: { type: SchemaType.STRING },
        },
        required: ['step', 'line', 'event', 'description', 'variables', 'callStack', 'output', 'isErrorStep', 'errorMessage'],
      },
    },
    narrationEnglish: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    narrationHinglish: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    concepts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    learningTips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    'language',
    'title',
    'summary',
    'issues',
    'correctedCode',
    'lineByLineExplanation',
    'dryRun',
    'narrationEnglish',
    'narrationHinglish',
    'concepts',
    'learningTips',
  ],
};

const dryRunOnlySchema = {
  type: SchemaType.OBJECT,
  properties: {
    dryRun: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.INTEGER },
          line: { type: SchemaType.INTEGER },
          event: {
            type: SchemaType.STRING,
            enum: ['assignment', 'condition', 'loop-iteration', 'function-call', 'return', 'output', 'error'],
          },
          description: { type: SchemaType.STRING },
          variables: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING },
                scope: { type: SchemaType.STRING },
              },
              required: ['name', 'value', 'type', 'scope'],
            },
          },
          callStack: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          output: { type: SchemaType.STRING },
          isErrorStep: { type: SchemaType.BOOLEAN },
          errorMessage: { type: SchemaType.STRING },
        },
        required: ['step', 'line', 'event', 'description', 'variables', 'callStack', 'output', 'isErrorStep', 'errorMessage'],
      },
    },
    narrationEnglish: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    narrationHinglish: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['dryRun', 'narrationEnglish', 'narrationHinglish'],
};

const explainSchema = {
  type: SchemaType.OBJECT,
  properties: {
    explanation: { type: SchemaType.STRING },
    keyTakeaways: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    exampleSnippet: { type: SchemaType.STRING },
  },
  required: ['explanation', 'keyTakeaways', 'exampleSnippet'],
};

export async function analyzeCodeWithGemini(input: AnalyzeCodeInput): Promise<GeminiDebugAnalysisResult> {
  const prompt = `You are an expert static analyzer, code debugger, and computer science tutor for Cadence.
Analyze the following ${input.language} code thoroughly.

RULES FOR ANALYSIS & TRACE GENERATION:
1. Detect all syntax, logic, runtime, performance, style, and security issues. For each issue provide type, severity, 1-based line number, exact offending snippet, clear message, explanation of why it happens, recommended fix, and correctedSnippet.
2. Provide a full working correctedCode string.
3. Provide lineByLineExplanation covering important lines (1-based line numbers).
4. Generate a deterministic step-by-step dry run trace of the code execution:
   - Max 100 steps. If loops run longer, summarize or trace the first few iterations and terminate cleanly.
   - Every step MUST have 1-based line number matching the source code.
   - event must be one of: "assignment", "condition", "loop-iteration", "function-call", "return", "output", "error".
   - Include complete visible variable state after each step (every value must be a string, e.g. "0", "[1, 2, 3]", "None", "\"hello\"").
   - Include callStack for active function calls (e.g. ["main"], ["main", "factorial(3)"]).
   - Include cumulative program output string up to that step.
   - If there is a runtime error (e.g. index out of bounds, division by zero, null pointer, recursion depth), include an error step (isErrorStep: true) with an informative errorMessage where the execution crashes.
   - If there is an infinite loop or potential hang, mark the step clearly and do not exceed 40 loop iterations in trace.
5. Narration requirements:
   - Provide "narrationEnglish" and "narrationHinglish" arrays.
   - CRITICAL: "narrationEnglish" and "narrationHinglish" MUST have the EXACT SAME length as the "dryRun" array (one narration sentence corresponding to each dry run step).
   - Hinglish must be natural conversational Hinglish as spoken by Indian tech students/engineers (e.g., "Pehle sum ko zero initialize kiya gaya", "Ab loop condition check ho rahi hai jisme i ki value 0 hai"), NOT literal machine translation.
6. Provide concepts and learningTips relevant to the code and issues found.
${input.userQuestion ? `User specific question: "${input.userQuestion}" - ensure you address this directly in summary and issues.` : ''}

Language: ${input.language}
Explanation preference: ${input.explanationLanguage || 'english'}

CODE TO ANALYZE:
\`\`\`${input.language}
${input.code}
\`\`\`
`;

  const result = await callGeminiJson<GeminiDebugAnalysisResult>(prompt, debugAnalysisSchema);

  // Safeguard: Ensure narration arrays match dryRun length
  const dryRunLen = result.dryRun.length;
  if (result.narrationEnglish.length < dryRunLen) {
    while (result.narrationEnglish.length < dryRunLen) {
      const idx = result.narrationEnglish.length;
      result.narrationEnglish.push(result.dryRun[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (result.narrationEnglish.length > dryRunLen) {
    result.narrationEnglish = result.narrationEnglish.slice(0, dryRunLen);
  }

  if (result.narrationHinglish.length < dryRunLen) {
    while (result.narrationHinglish.length < dryRunLen) {
      const idx = result.narrationHinglish.length;
      result.narrationHinglish.push(result.dryRun[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (result.narrationHinglish.length > dryRunLen) {
    result.narrationHinglish = result.narrationHinglish.slice(0, dryRunLen);
  }

  return result;
}

export async function generateDryRunTraceWithGemini(input: DryRunOnlyInput): Promise<DryRunOnlyResult> {
  const prompt = `You are a code execution visualizer and dry-run tracer for Cadence.
Generate a deterministic, step-by-step dry run trace for this ${input.language} code.

RULES:
1. Max 100 steps.
2. Every step must have 1-based line number matching the source code line.
3. Every step includes event, description, visible variables (with serialized string values), callStack array, cumulative output string, isErrorStep boolean, and errorMessage string.
4. If the code crashes or has an error, mark isErrorStep: true on the step it fails.
5. Provide matching narrationEnglish and narrationHinglish arrays.
6. CRITICAL: narrationEnglish and narrationHinglish MUST have the EXACT SAME length as the dryRun array.
7. Hinglish must be conversational and natural (e.g. "Variable count ko 1 se badhaya gaya").

Language: ${input.language}
CODE:
\`\`\`${input.language}
${input.code}
\`\`\`
`;

  const result = await callGeminiJson<DryRunOnlyResult>(prompt, dryRunOnlySchema);

  const dryRunLen = result.dryRun.length;
  if (result.narrationEnglish.length < dryRunLen) {
    while (result.narrationEnglish.length < dryRunLen) {
      const idx = result.narrationEnglish.length;
      result.narrationEnglish.push(result.dryRun[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (result.narrationEnglish.length > dryRunLen) {
    result.narrationEnglish = result.narrationEnglish.slice(0, dryRunLen);
  }

  if (result.narrationHinglish.length < dryRunLen) {
    while (result.narrationHinglish.length < dryRunLen) {
      const idx = result.narrationHinglish.length;
      result.narrationHinglish.push(result.dryRun[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (result.narrationHinglish.length > dryRunLen) {
    result.narrationHinglish = result.narrationHinglish.slice(0, dryRunLen);
  }

  return result;
}

export async function explainDebuggerTopicWithGemini(input: ExplainCodeInput): Promise<ExplainCodeResult> {
  const prompt = `You are a coding instructor at Cadence.
Provide a clear, pedagogical explanation for the user's inquiry regarding this ${input.language} code.

Context details:
${input.line ? `- Targeted Line Number: ${input.line}` : ''}
${input.error ? `- Error to explain: "${input.error}"` : ''}
${input.concept ? `- Concept to explain: "${input.concept}"` : ''}
${input.explanationLanguage ? `- Preferred Language: ${input.explanationLanguage} (if hinglish, explain conversationally in mixed Hindi-English)` : ''}

Code snippet:
\`\`\`${input.language}
${input.code}
\`\`\`

Explain the core principle, why it behaves this way, provide 2-4 key takeaways, and an example snippet demonstrating the fix or best practice.
`;

  return callGeminiJson<ExplainCodeResult>(prompt, explainSchema);
}

