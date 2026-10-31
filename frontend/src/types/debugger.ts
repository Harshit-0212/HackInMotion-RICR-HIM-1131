export type SupportedDebuggerLanguage = 'c' | 'cpp' | 'java' | 'python' | 'javascript';

export type IssueType = 'syntax' | 'logic' | 'runtime' | 'performance' | 'style' | 'security';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CodeIssue {
  type: IssueType;
  severity: IssueSeverity;
  line: number;
  snippet: string;
  message: string;
  why: string;
  fix: string;
  correctedSnippet: string;
}

export interface LineByLineExplanation {
  line: number;
  explanation: string;
}

export interface DryRunVariable {
  name: string;
  value: string;
  type: string;
  scope: string;
}

export type DryRunEvent =
  | 'assignment'
  | 'condition'
  | 'loop-check'
  | 'loop-body'
  | 'loop-iteration'
  | 'function-call'
  | 'return'
  | 'output'
  | 'error';

export interface DryRunStep {
  step: number;
  line: number;
  event: DryRunEvent;
  description: string;
  variables: DryRunVariable[];
  callStack: string[];
  output: string;
  isErrorStep: boolean;
  errorMessage: string;
}

export interface GeminiDebugAnalysisResult {
  language: SupportedDebuggerLanguage;
  title: string;
  summary: string;
  issues: CodeIssue[];
  correctedCode: string;
  lineByLineExplanation: LineByLineExplanation[];
  dryRun: DryRunStep[];
  narrationEnglish: string[];
  narrationHinglish: string[];
  concepts: string[];
  learningTips: string[];
  isTruncated?: boolean;
}

export interface StoredDebugSessionSummary {
  _id: string;
  userId: string;
  title: string;
  language: SupportedDebuggerLanguage;
  issues: CodeIssue[];
  explanation: {
    summary: string;
    lineByLineExplanation: LineByLineExplanation[];
    concepts: string[];
    learningTips: string[];
  };
  createdAt: string;
  updatedAt: string;
  isTruncated?: boolean;
}

export interface StoredDebugSession extends StoredDebugSessionSummary {
  originalCode: string;
  correctedCode: string;
  dryRun: DryRunStep[];
  narrationEnglish: string[];
  narrationHinglish: string[];
}

export interface AnalyzeCodeInput {
  language: SupportedDebuggerLanguage;
  code: string;
  userQuestion?: string;
  explanationLanguage?: 'english' | 'hinglish';
}

export interface ExplainCodeInput {
  language: SupportedDebuggerLanguage;
  code: string;
  line?: number;
  error?: string;
  concept?: string;
  explanationLanguage?: 'english' | 'hinglish';
}

export interface ExplainCodeResult {
  explanation: string;
  keyTakeaways: string[];
  exampleSnippet?: string;
}
