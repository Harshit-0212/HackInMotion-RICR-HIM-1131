import { config } from '../config.js';

export interface CodeExecutionRequest {
  language: 'c' | 'cpp' | 'java' | 'python';
  code: string;
  input?: string;
}

export interface CodeExecutionResult {
  status: 'success' | 'error' | 'timeout' | 'compile_error' | 'runtime_error';
  output: string;
  error?: string;
  exitCode?: number | null;
  time?: string;
  memory?: string;
}

const LANGUAGE_COMPILER_MAP: Record<string, string> = {
  c: 'gcc-15',
  cpp: 'g++-15',
  java: 'openjdk-25',
  python: 'python-3.14',
};

export const VERIFIED_EXECUTION_LANGUAGES = ['c', 'cpp', 'java', 'python'] as const;

const EXECUTION_ENDPOINT = 'https://api.onlinecompiler.io/api/run-code-sync/';

export async function executeCodeSync(req: CodeExecutionRequest): Promise<CodeExecutionResult> {
  const apiKey = config.codeExecutionApiKey;
  if (!apiKey) {
    throw new Error('Code execution engine is not configured on the server.');
  }

  const compiler = LANGUAGE_COMPILER_MAP[req.language];
  if (!compiler) {
    throw new Error(`Unsupported programming language: ${req.language}`);
  }

  const controller = new AbortController();
  const timeoutMs = 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(EXECUTION_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        compiler,
        code: req.code,
        input: req.input || '',
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
      throw new Error('Code execution authentication failed with provider.');
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Execution provider returned status ${res.status}: ${errText.slice(0, 150)}`);
    }

    const data = await res.json() as Record<string, any>;

    const statusVal = data.status || 'unknown';
    const outputVal = typeof data.output === 'string' ? data.output : '';
    const errorVal = typeof data.error === 'string' ? data.error : '';
    const exitCodeVal = typeof data.exit_code === 'number' ? data.exit_code : null;

    let computedStatus: CodeExecutionResult['status'] = 'success';
    if (statusVal === 'compile_error' || (errorVal && errorVal.includes('error:'))) {
      computedStatus = 'compile_error';
    } else if (statusVal === 'timeout') {
      computedStatus = 'timeout';
    } else if (exitCodeVal !== 0 && exitCodeVal !== null) {
      computedStatus = 'runtime_error';
    } else if (statusVal !== 'success') {
      computedStatus = 'error';
    }

    return {
      status: computedStatus,
      output: outputVal,
      error: errorVal || undefined,
      exitCode: exitCodeVal,
      time: data.time,
      memory: data.memory,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        status: 'timeout',
        output: '',
        error: 'Execution timed out after 25 seconds.',
      };
    }
    throw err;
  }
}

