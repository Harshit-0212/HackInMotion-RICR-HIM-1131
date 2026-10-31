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
  DryRunStep,
  DryRunEvent,
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
const MAX_DRY_RUN_STEPS = 300;

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
            enum: ['assignment', 'condition', 'loop-check', 'loop-body', 'loop-iteration', 'function-call', 'return', 'output', 'error'],
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
            enum: ['assignment', 'condition', 'loop-check', 'loop-body', 'loop-iteration', 'function-call', 'return', 'output', 'error'],
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

/**
 * Validates, repairs, and sanitizes dry-run steps and narration arrays
 */
function sanitizeAndRepairTrace(
  rawDryRun: DryRunStep[],
  rawNarrationEn: string[],
  rawNarrationHi: string[]
): { dryRun: DryRunStep[]; narrationEnglish: string[]; narrationHinglish: string[]; isTruncated: boolean } {
  let isTruncated = false;
  let steps = Array.isArray(rawDryRun) ? rawDryRun : [];

  // Truncate safely if exceeding maximum steps
  if (steps.length > MAX_DRY_RUN_STEPS) {
    steps = steps.slice(0, MAX_DRY_RUN_STEPS);
    isTruncated = true;
  }

  // Repair steps if missing required fields
  const validEvents: Set<string> = new Set([
    'assignment',
    'condition',
    'loop-check',
    'loop-body',
    'loop-iteration',
    'function-call',
    'return',
    'output',
    'error',
  ]);

  const sanitizedSteps: DryRunStep[] = steps.map((s, idx) => {
    const stepNum = typeof s.step === 'number' && s.step > 0 ? s.step : idx + 1;
    const lineNum = typeof s.line === 'number' && s.line > 0 ? s.line : 1;
    const event: DryRunEvent = validEvents.has(s.event) ? (s.event as DryRunEvent) : 'assignment';
    const description = typeof s.description === 'string' && s.description.trim() ? s.description : `Step ${stepNum}`;
    const variables = Array.isArray(s.variables)
      ? s.variables.map((v) => ({
          name: typeof v?.name === 'string' ? v.name : 'var',
          value: typeof v?.value === 'string' ? v.value : String(v?.value ?? ''),
          type: typeof v?.type === 'string' ? v.type : 'any',
          scope: typeof v?.scope === 'string' ? v.scope : 'local',
        }))
      : [];
    const callStack = Array.isArray(s.callStack)
      ? s.callStack.map((frame) => (typeof frame === 'string' ? frame : String(frame)))
      : ['main'];
    const output = typeof s.output === 'string' ? s.output : '';
    const isErrorStep = Boolean(s.isErrorStep);
    const errorMessage = typeof s.errorMessage === 'string' ? s.errorMessage : '';

    return {
      step: stepNum,
      line: lineNum,
      event,
      description,
      variables,
      callStack,
      output,
      isErrorStep,
      errorMessage,
    };
  });

  // If trace was completely empty, add a baseline step
  if (sanitizedSteps.length === 0) {
    sanitizedSteps.push({
      step: 1,
      line: 1,
      event: 'assignment',
      description: 'Program execution started.',
      variables: [],
      callStack: ['main'],
      output: '',
      isErrorStep: false,
      errorMessage: '',
    });
  }

  const dryRunLen = sanitizedSteps.length;
  let narrationEnglish = Array.isArray(rawNarrationEn) ? [...rawNarrationEn] : [];
  let narrationHinglish = Array.isArray(rawNarrationHi) ? [...rawNarrationHi] : [];

  if (narrationEnglish.length < dryRunLen) {
    while (narrationEnglish.length < dryRunLen) {
      const idx = narrationEnglish.length;
      narrationEnglish.push(sanitizedSteps[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (narrationEnglish.length > dryRunLen) {
    narrationEnglish = narrationEnglish.slice(0, dryRunLen);
  }

  if (narrationHinglish.length < dryRunLen) {
    while (narrationHinglish.length < dryRunLen) {
      const idx = narrationHinglish.length;
      narrationHinglish.push(sanitizedSteps[idx]?.description || `Step ${idx + 1}`);
    }
  } else if (narrationHinglish.length > dryRunLen) {
    narrationHinglish = narrationHinglish.slice(0, dryRunLen);
  }

  return {
    dryRun: sanitizedSteps,
    narrationEnglish,
    narrationHinglish,
    isTruncated,
  };
}

export async function analyzeCodeWithGemini(input: AnalyzeCodeInput): Promise<GeminiDebugAnalysisResult> {
  const prompt = `You are an expert static analyzer, code debugger, and computer science tutor for Cadence.
Analyze the following ${input.language} code thoroughly.

RULES FOR ANALYSIS & TRACE GENERATION:
1. Detect all syntax, logic, runtime, performance, style, and security issues. For each issue provide type, severity, 1-based line number, exact offending snippet, clear message, explanation of why it happens, recommended fix, and correctedSnippet.
2. Provide a full working correctedCode string.
3. Provide lineByLineExplanation covering important lines (1-based line numbers).
4. DRY-RUN TRACE GENERATION RULES (CRITICAL):
   “Generate a complete line-by-line dry run. Include a separate step for every meaningful execution event, including variable initialization, condition evaluation, loop-condition checks, loop-body execution, variable updates, function calls, argument passing, return values, recursion, input reading, and output printing. Do not skip any important step. The number of narration entries must exactly equal the number of dry-run steps.”

   - For loops, generate separate steps for:
     * Loop condition check (event: "loop-check")
     * Loop body execution statement by statement (event: "loop-body" or "assignment")
     * Loop counter/variable update (event: "loop-iteration" or "assignment")
     * Next loop condition check
   - For functions and recursion, generate separate steps for:
     * Function call (event: "function-call")
     * Parameter assignment in new stack frame (event: "assignment")
     * Function body execution
     * Return value calculation (event: "return")
     * Return to caller and popping stack frame
     * Caller resuming execution
   - For conditional statements, generate separate steps for:
     * Condition evaluation (event: "condition")
     * Taken or not-taken branch determination
     * Statements inside the taken branch
   - “Simulate program output exactly. Include every printed value, newline, and partial output state at the correct execution step. Do not invent output that the code would not produce.”
   - Every step MUST have exact 1-based line number matching the source code line executing.
   - event must be one of: "assignment", "condition", "loop-check", "loop-body", "loop-iteration", "function-call", "return", "output", "error".
   - Include complete visible variable state after each step (every value must be a string, e.g. "0", "[1, 2, 3]", "None", "\\"hello\\"").
   - Include callStack for active function calls (e.g. ["main"], ["main", "factorial(3)"]).
   - Include cumulative program output string up to that step, preserving newlines (\\n) and spaces.
   - If there is a runtime error (e.g. index out of bounds, division by zero, null pointer, recursion depth), include an error step (isErrorStep: true) with an informative errorMessage where the execution crashes.
   - If there is an infinite loop or high iteration count, simulate up to 300 steps and terminate cleanly.
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

  // Validate, sanitize, and repair trace & narrations
  const repaired = sanitizeAndRepairTrace(result.dryRun, result.narrationEnglish, result.narrationHinglish);
  result.dryRun = repaired.dryRun;
  result.narrationEnglish = repaired.narrationEnglish;
  result.narrationHinglish = repaired.narrationHinglish;
  result.isTruncated = repaired.isTruncated;

  return result;
}

export async function generateDryRunTraceWithGemini(input: DryRunOnlyInput): Promise<DryRunOnlyResult> {
  const prompt = `You are a code execution visualizer and dry-run tracer for Cadence.
Generate a deterministic, complete line-by-line step-by-step dry run trace for this ${input.language} code.

RULES:
“Generate a complete line-by-line dry run. Include a separate step for every meaningful execution event, including variable initialization, condition evaluation, loop-condition checks, loop-body execution, variable updates, function calls, argument passing, return values, recursion, input reading, and output printing. Do not skip any important step. The number of narration entries must exactly equal the number of dry-run steps.”

- For loops: separate step for condition check ("loop-check"), body execution ("loop-body"), variable update ("loop-iteration").
- For functions & recursion: function call ("function-call"), argument binding, body lines, return ("return").
- For conditions: evaluation step ("condition"), branching step.
- “Simulate program output exactly. Include every printed value, newline, and partial output state at the correct execution step. Do not invent output that the code would not produce.”
- Max 300 steps.
- Every step must have 1-based line number matching the source code line.
- Every step includes event, description, visible variables (with serialized string values), callStack array, cumulative output string, isErrorStep boolean, and errorMessage string.
- If the code crashes or has an error, mark isErrorStep: true on the step it fails.
- Provide matching narrationEnglish and narrationHinglish arrays.
- CRITICAL: narrationEnglish and narrationHinglish MUST have the EXACT SAME length as the dryRun array.
- Hinglish must be conversational and natural (e.g. "Variable count ko 1 se badhaya gaya").

Language: ${input.language}
CODE:
\`\`\`${input.language}
${input.code}
\`\`\`
`;

  const result = await callGeminiJson<DryRunOnlyResult>(prompt, dryRunOnlySchema);

  const repaired = sanitizeAndRepairTrace(result.dryRun, result.narrationEnglish, result.narrationHinglish);
  result.dryRun = repaired.dryRun;
  result.narrationEnglish = repaired.narrationEnglish;
  result.narrationHinglish = repaired.narrationHinglish;
  result.isTruncated = repaired.isTruncated;

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
