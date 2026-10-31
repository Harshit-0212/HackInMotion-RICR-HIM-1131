export type SupportedCodingLanguage = 'cpp' | 'java' | 'python';

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';

export type ProblemStatus = 'draft' | 'reviewed' | 'published' | 'archived';

export type TestCaseVisibility = 'sample' | 'hidden';

export type CheckerPolicyType = 'exact' | 'token' | 'lines';

export interface CheckerPolicy {
  type: CheckerPolicyType;
  ignoreTrailingWhitespace: boolean;
  trimNewlines: boolean;
  caseSensitive: boolean;
  floatTolerance?: number;
}

export interface ExecutionLimits {
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface StarterCodeMap {
  cpp: string;
  java: string;
  python: string;
}

export interface PublicSampleCase {
  caseKey: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  order: number;
}

export interface PublicCodingProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  topic: string;
  tags: string[];
  supportedLanguages: SupportedCodingLanguage[];
  executionLimits: ExecutionLimits;
  sampleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCodingProblemDetail {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  topic: string;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  supportedLanguages: SupportedCodingLanguage[];
  starterCodeByLanguage: StarterCodeMap;
  executionLimits: ExecutionLimits;
  checkerPolicy: {
    type: CheckerPolicyType;
    ignoreTrailingWhitespace: boolean;
    trimNewlines: boolean;
    caseSensitive: boolean;
  };
  sampleCases: PublicSampleCase[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredCodingProblem {
  _id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  topic: string;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  supportedLanguages: SupportedCodingLanguage[];
  starterCodeByLanguage: StarterCodeMap;
  executionLimits: ExecutionLimits;
  checkerPolicy: CheckerPolicy;
  status: ProblemStatus;
  contentVersion: number;
  reviewedVersion?: number | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  verificationMethod?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCodingTestCase {
  _id: string;
  problemId: string;
  caseKey: string;
  visibility: TestCaseVisibility;
  input: string;
  expectedOutput: string;
  explanation?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressiveHint {
  step: number;
  title: string;
  content: string;
}

export interface ReferenceSolution {
  language: SupportedCodingLanguage;
  solutionCode: string;
  approachExplanation?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

export interface StoredCodingProblemPrivate {
  _id: string;
  problemId: string;
  referenceSolutions: ReferenceSolution[];
  progressiveHints: ProgressiveHint[];
  editorial: string;
  verificationNotes?: string;
  verificationStatus: 'unverified' | 'manual_verified' | 'ai_generated';
  verificationMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCodingProblemInput {
  title: string;
  slug?: string;
  difficulty: ProblemDifficulty;
  topic: string;
  tags?: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  supportedLanguages?: SupportedCodingLanguage[];
  starterCodeByLanguage?: Partial<StarterCodeMap>;
  executionLimits?: Partial<ExecutionLimits>;
  checkerPolicy?: Partial<CheckerPolicy>;
}

export interface UpdateCodingProblemInput {
  title?: string;
  slug?: string;
  difficulty?: ProblemDifficulty;
  topic?: string;
  tags?: string[];
  statement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  supportedLanguages?: SupportedCodingLanguage[];
  starterCodeByLanguage?: Partial<StarterCodeMap>;
  executionLimits?: Partial<ExecutionLimits>;
  checkerPolicy?: Partial<CheckerPolicy>;
}

export interface CreateTestCaseInput {
  visibility: TestCaseVisibility;
  input: string;
  expectedOutput: string;
  explanation?: string;
  order?: number;
}

export interface UpdateTestCaseInput {
  visibility?: TestCaseVisibility;
  input?: string;
  expectedOutput?: string;
  explanation?: string;
  order?: number;
}

export interface UpdatePrivateContentInput {
  referenceSolutions?: ReferenceSolution[];
  progressiveHints?: ProgressiveHint[];
  editorial?: string;
  verificationNotes?: string;
  verificationMethod?: string;
}

export interface ReviewProblemInput {
  verificationMethod: string;
  notes?: string;
}

export interface GenerateDraftInput {
  topic: string;
  subtopic?: string;
  difficulty: ProblemDifficulty;
  targetAudience?: string;
  additionalConstraints?: string;
}

