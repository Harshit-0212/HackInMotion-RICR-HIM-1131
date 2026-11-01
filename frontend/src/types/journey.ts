/**
 * Frontend types for the learning journey system.
 * Mirror the backend PublicDTOs — no private fields (correct answers, hidden tests).
 */

export type JourneyStatus = 'draft' | 'published' | 'archived';
export type StageType = 'topic' | 'pattern' | 'milestone';
export type ActivityType =
  | 'lesson'
  | 'comprehension_predict'
  | 'comprehension_trace'
  | 'comprehension_explain'
  | 'comprehension_find_bug'
  | 'comprehension_fix_bug'
  | 'comprehension_edge_case'
  | 'coding_practice';

export type StageProgressState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'checkpoint_eligible'
  | 'passed'
  | 'needs_review';

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';
export type GradeVerdict = 'pass' | 'fail' | 'incomplete';
export type KnowledgeQuestionType = 'mcq' | 'true_false';

// ─── Journey ─────────────────────────────────────────────────────────────────

export interface Journey {
  id: string;
  slug: string;
  title: string;
  description: string;
  stageIds: string[];
  milestoneStageIds: string[];
  totalStages: number;
}

// ─── Stage ────────────────────────────────────────────────────────────────────

export interface CheckpointInfo {
  knowledgeQuestionCount: number;
  codingTaskCount: number;
  knowledgePassPercent: number;
  codingPassCount: number;
}

export interface Stage {
  id: string;
  journeyId: string;
  slug: string;
  title: string;
  learningGoal: string;
  type: StageType;
  prerequisiteStageIds: string[];
  activityIds: string[];
  topicTags: string[];
  checkpoint: CheckpointInfo;
  previewUnlocked: boolean;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface LessonContent {
  body: string;
  hints: { step: number; title: string; content: string }[];
}

export interface ComprehensionContent {
  language: string;
  codeSnippet: string;
  prompt: string;
  explanation: string;
  relevance: string;
  expectedOutput?: string;
  codingProblemId?: string;
}

export interface Activity {
  id: string;
  stageId: string;
  title: string;
  type: ActivityType;
  isRequired: boolean;
  order: number;
  lessonContent?: LessonContent;
  comprehensionContent?: ComprehensionContent;
  codingProblemId?: string;
}

// ─── Knowledge questions ──────────────────────────────────────────────────────

export interface QuestionOption {
  id: string;
  text: string;
}

export interface KnowledgeQuestion {
  id: string;
  type: KnowledgeQuestionType;
  prompt: string;
  options: QuestionOption[];
  difficulty: 'easy' | 'medium' | 'hard';
  conceptTags: string[];
}

export interface RevealedKnowledgeQuestion extends KnowledgeQuestion {
  correctOptionId: string;
  explanation: string;
}

// ─── Checkpoint attempt ───────────────────────────────────────────────────────

export interface AttemptCodingTask {
  codingProblemId: string;
  problemSlug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CodingGradeItem {
  codingProblemId: string;
  passed: boolean;
  verdict: string;
}

export interface KnowledgeGradeItem {
  questionId: string;
  selectedOptionId: string | null;
  correct: boolean;
  conceptTags: string[];
}

export interface CheckpointAttempt {
  id: string;
  stageId: string;
  journeyId: string;
  status: AttemptStatus;
  knowledgeQuestions: KnowledgeQuestion[];
  codingTasks: AttemptCodingTask[];
  blueprint: CheckpointInfo & {
    minKnowledgeQuestions: number;
    minCodingTasks: number;
  };
  knowledgeAnswers: Record<string, string>;
  codingResults: CodingGradeItem[];
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
}

export interface GradedAttempt {
  id: string;
  stageId: string;
  journeyId: string;
  status: AttemptStatus;
  verdict: GradeVerdict;
  knowledgeScore: number;
  codingPassCount: number;
  blueprint: CheckpointAttempt['blueprint'];
  knowledgeQuestions: RevealedKnowledgeQuestion[];
  knowledgeGrades: KnowledgeGradeItem[];
  codingTasks: AttemptCodingTask[];
  codingResults: CodingGradeItem[];
  weakConceptTags: string[];
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ActivityCompletion {
  activityId: string;
  completedAt: string;
}

export interface StudentJourneyProgress {
  journeyId: string;
  stageStates: Record<string, StageProgressState>;
  completedActivities: ActivityCompletion[];
  solvedCodingProblems: Record<string, { solvedAt: string; verdict: string }>;
  lastActiveAt: string;
}

// ─── Comprehension answer ─────────────────────────────────────────────────────

export interface ComprehensionResult {
  correct: boolean | null;
  explanation: string;
  reviewedAnswer?: string;
  relevance: string;
}

// ─── Practice submit result ───────────────────────────────────────────────────

export interface PracticeSubmitResult {
  verdict: 'accepted' | 'wrong_answer';
  passed: boolean;
  sampleResults: {
    caseKey: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
  }[];
}

// ─── Coding judge result (in checkpoint) ─────────────────────────────────────

export interface CheckpointJudgeResult {
  verdict: string;
  passed: boolean;
  sampleResults: { caseKey: string; passed: boolean }[];
  hiddenPassCount: number;
  hiddenTotal: number;
}

