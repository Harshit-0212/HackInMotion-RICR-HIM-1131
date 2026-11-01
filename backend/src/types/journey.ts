/**
 * Learning Journey — core type definitions for the mastery-based learning system.
 *
 * Hierarchy:
 *   Journey → Stages (Topics/Patterns) → Activities → Checkpoints → Milestones
 *
 * Key design principles:
 * - Deterministic core: all progression logic runs server-side
 * - Prerequisite graph is always cycle-free (validated on publish)
 * - Draft/Review/Published workflow, versioned
 * - Immutable attempt snapshots (questions + policy frozen at attempt start)
 */

// ─── Journey ──────────────────────────────────────────────────────────────────

export type JourneyStatus = 'draft' | 'published' | 'archived';

export interface StoredJourney {
  _id: string; // "journey_..."
  slug: string;
  title: string;
  description: string;
  /** Ordered list of stage IDs */
  stageIds: string[];
  /** IDs of stages that are designated milestones */
  milestoneStageIds: string[];
  status: JourneyStatus;
  contentVersion: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stage ────────────────────────────────────────────────────────────────────

export type StageType = 'topic' | 'pattern' | 'milestone';

export type StageStatus = 'draft' | 'published' | 'archived';

export interface CheckpointBlueprint {
  /**
   * Minimum number of approved MCQ/short-answer questions required
   * for this checkpoint to be deployable. Prevents silent under-testing.
   */
  minKnowledgeQuestions: number;
  /**
   * Minimum number of approved coding tasks required.
   */
  minCodingTasks: number;
  /** 0–100; minimum score on the knowledge portion */
  knowledgePassPercent: number;
  /** 0 to minCodingTasks; minimum coding tasks that must pass */
  codingPassCount: number;
  /** How many questions appear in the delivered checkpoint */
  knowledgeQuestionCount: number;
  codingTaskCount: number;
}

export interface StoredStage {
  _id: string; // "stage_..."
  journeyId: string;
  slug: string;
  title: string;
  learningGoal: string;
  /** Stage type — controls checkpoint blueprint defaults */
  type: StageType;
  /**
   * IDs of stages that must be PASSED before this one is unlocked.
   * Server validates these are cycle-free on publish.
   */
  prerequisiteStageIds: string[];
  /** Ordered list of activity IDs belonging to this stage */
  activityIds: string[];
  /** Single checkpoint config for this stage */
  checkpoint: CheckpointBlueprint;
  /** Topics / patterns taught — used for question tagging and weak-skill mapping */
  topicTags: string[];
  status: StageStatus;
  contentVersion: number;
  /** If true, students may access this stage without completing prerequisites (preview-only) */
  previewUnlocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'lesson'
  | 'comprehension_predict'
  | 'comprehension_trace'
  | 'comprehension_explain'
  | 'comprehension_find_bug'
  | 'comprehension_fix_bug'
  | 'comprehension_edge_case'
  | 'coding_practice';

export type ActivityStatus = 'draft' | 'published';

export interface LessonContent {
  /** Markdown body */
  body: string;
  /** Stored progressive hints (never shown during checkpoint) */
  hints: { step: number; title: string; content: string }[];
}

export interface ComprehensionContent {
  /** Language-specific code snippet shown to the student */
  language: string;
  codeSnippet: string;
  /** The task prompt shown to the student */
  prompt: string;
  /**
   * For predict/trace/explain/find_bug/edge_case: reviewed correct answer.
   * For fix_bug: the fix is judged by actual execution against approved test cases.
   * Never sent to client during an active checkpoint.
   */
  reviewedAnswer?: string;
  /** Reviewed explanation shown AFTER the student submits */
  explanation: string;
  /** "Why this matters" context shown after submission */
  relevance: string;
  /**
   * For fix_bug/edge_case only: coding problem ID to use for execution judging.
   * If set, fix_bug uses the existing judging infrastructure.
   */
  codingProblemId?: string;
  /** Predicted output/trace point used for objective grading */
  expectedOutput?: string;
}

export interface StoredActivity {
  _id: string; // "act_..."
  stageId: string;
  journeyId: string;
  title: string;
  type: ActivityType;
  /** For lesson and comprehension types */
  lessonContent?: LessonContent;
  comprehensionContent?: ComprehensionContent;
  /**
   * For coding_practice: the linked published coding problem ID.
   * Solving this practice problem (all hidden tests pass) awards activity completion.
   * Does NOT automatically unlock the next stage — that requires a checkpoint pass.
   */
  codingProblemId?: string;
  /**
   * Whether completing this activity is required for checkpoint eligibility.
   * Optional activities contribute to learning but do not block checkpoint access.
   */
  isRequired: boolean;
  order: number;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── MCQ / Knowledge Question Bank ───────────────────────────────────────────

export type KnowledgeQuestionType = 'mcq' | 'true_false';

export type KnowledgeQuestionStatus = 'draft' | 'approved';

export interface KnowledgeQuestionOption {
  id: string; // "opt_a" | "opt_b" | ...
  text: string;
}

export interface StoredKnowledgeQuestion {
  _id: string; // "kq_..."
  /**
   * Stage this question belongs to; used for checkpoint blueprint coverage checks.
   */
  stageId: string;
  journeyId: string;
  type: KnowledgeQuestionType;
  prompt: string;
  options: KnowledgeQuestionOption[]; // 2 for true_false, 4 for mcq
  /**
   * The correct option ID. Stored server-side; never sent to client
   * during an active attempt.
   */
  correctOptionId: string;
  /** Explanation shown AFTER the attempt is submitted, not during. */
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Fine-grained concept tags for weak-skill mapping */
  conceptTags: string[];
  status: KnowledgeQuestionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Checkpoint Attempt ───────────────────────────────────────────────────────

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export type GradeVerdict = 'pass' | 'fail' | 'incomplete';

/** Immutable snapshot of one knowledge question in an attempt */
export interface AttemptKnowledgeQuestion {
  questionId: string;
  type: KnowledgeQuestionType;
  prompt: string;
  options: KnowledgeQuestionOption[];
  /** NOT included in the API response to client during in_progress */
  correctOptionId?: string;
  explanation?: string;
  conceptTags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Immutable snapshot of one coding task in an attempt */
export interface AttemptCodingTask {
  codingProblemId: string;
  problemSlug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Per-question grading result (populated on submission) */
export interface KnowledgeGradeItem {
  questionId: string;
  selectedOptionId: string | null;
  correct: boolean;
  conceptTags: string[];
}

/** Per-coding-task grading result */
export interface CodingGradeItem {
  codingProblemId: string;
  passed: boolean;
  /** Verdict from the judging run: 'accepted' | 'wrong_answer' | 'compile_error' | etc. */
  verdict: string;
}

export interface StoredCheckpointAttempt {
  _id: string; // "attempt_..."
  userId: string;
  stageId: string;
  journeyId: string;
  /**
   * Content version of the stage at attempt start.
   * If stage content changes, this attempt remains tied to the old version.
   */
  stageContentVersion: number;
  /**
   * Grading policy version frozen at attempt start.
   * Prevents silent policy changes mid-attempt.
   */
  policyVersion: number;
  /** Frozen snapshot of knowledge questions delivered */
  knowledgeQuestions: AttemptKnowledgeQuestion[];
  /** Frozen snapshot of coding tasks delivered */
  codingTasks: AttemptCodingTask[];
  /** Frozen checkpoint blueprint used for pass/fail determination */
  blueprint: CheckpointBlueprint;
  status: AttemptStatus;
  /** Answers submitted by the student (option IDs per questionId) */
  knowledgeAnswers: Record<string, string>;
  /** Judging results for coding tasks (populated as tasks are judged) */
  codingResults: CodingGradeItem[];
  /** Full grading breakdown (populated after submission) */
  knowledgeGrades: KnowledgeGradeItem[];
  /** Aggregate results */
  knowledgeScore?: number; // 0–100
  codingPassCount?: number;
  verdict?: GradeVerdict;
  /** ISO timestamp of attempt start */
  startedAt: string;
  /** ISO timestamp of final submission */
  submittedAt?: string;
  /** ISO timestamp of grading completion */
  gradedAt?: string;
  /**
   * Attempt number for this user/stage pair (1-indexed).
   * Allows retry tracking without destroying prior evidence.
   */
  attemptNumber: number;
}

// ─── Student Progress ─────────────────────────────────────────────────────────

export type StageProgressState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'checkpoint_eligible'
  | 'passed'
  | 'needs_review';

export interface ActivityCompletion {
  activityId: string;
  completedAt: string;
}

export interface StoredStudentJourneyProgress {
  _id: string; // "jp_..."
  userId: string;
  journeyId: string;
  /**
   * Stage-level state. Server recomputes this from attempt history;
   * client cannot forge unlocks.
   */
  stageStates: Record<string, StageProgressState>;
  /** Activities the student has completed */
  completedActivities: ActivityCompletion[];
  /**
   * Coding problems solved (all hidden tests passed) within this journey.
   * Keyed by codingProblemId.
   */
  solvedCodingProblems: Record<string, { solvedAt: string; verdict: string }>;
  /** ISO of last interaction */
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Public DTOs (safe for client) ───────────────────────────────────────────

export interface PublicJourney {
  id: string;
  slug: string;
  title: string;
  description: string;
  stageIds: string[];
  milestoneStageIds: string[];
  totalStages: number;
}

export interface PublicStage {
  id: string;
  journeyId: string;
  slug: string;
  title: string;
  learningGoal: string;
  type: StageType;
  prerequisiteStageIds: string[];
  activityIds: string[];
  topicTags: string[];
  checkpoint: {
    knowledgeQuestionCount: number;
    codingTaskCount: number;
    knowledgePassPercent: number;
    codingPassCount: number;
  };
  previewUnlocked: boolean;
}

export interface PublicActivity {
  id: string;
  stageId: string;
  title: string;
  type: ActivityType;
  isRequired: boolean;
  order: number;
  /** Lesson body and hints — included for lesson/comprehension types */
  lessonContent?: {
    body: string;
    hints: { step: number; title: string; content: string }[];
  };
  comprehensionContent?: {
    language: string;
    codeSnippet: string;
    prompt: string;
    explanation: string; // withheld until after submission in checkpoint
    relevance: string;
    expectedOutput?: string; // withheld during active attempt
    codingProblemId?: string;
  };
  codingProblemId?: string;
}

/** Safe knowledge question DTO — no correctOptionId, no explanation (during attempt) */
export interface PublicKnowledgeQuestion {
  id: string;
  type: KnowledgeQuestionType;
  prompt: string;
  options: KnowledgeQuestionOption[];
  difficulty: 'easy' | 'medium' | 'hard';
  conceptTags: string[];
}

/** Knowledge question with answer revealed (post-submission) */
export interface RevealedKnowledgeQuestion extends PublicKnowledgeQuestion {
  correctOptionId: string;
  explanation: string;
}

export interface PublicCheckpointAttempt {
  id: string;
  stageId: string;
  journeyId: string;
  status: AttemptStatus;
  knowledgeQuestions: PublicKnowledgeQuestion[];
  codingTasks: AttemptCodingTask[];
  blueprint: CheckpointBlueprint;
  knowledgeAnswers: Record<string, string>;
  codingResults: CodingGradeItem[];
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
}

export interface GradedCheckpointAttempt {
  id: string;
  stageId: string;
  journeyId: string;
  status: AttemptStatus;
  verdict: GradeVerdict;
  knowledgeScore: number;
  codingPassCount: number;
  blueprint: CheckpointBlueprint;
  knowledgeQuestions: RevealedKnowledgeQuestion[];
  knowledgeGrades: KnowledgeGradeItem[];
  codingTasks: AttemptCodingTask[];
  codingResults: CodingGradeItem[];
  /** Weak concept tags identified from incorrect answers */
  weakConceptTags: string[];
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
}

export interface PublicStudentProgress {
  journeyId: string;
  stageStates: Record<string, StageProgressState>;
  completedActivities: ActivityCompletion[];
  solvedCodingProblems: Record<string, { solvedAt: string; verdict: string }>;
  lastActiveAt: string;
}

