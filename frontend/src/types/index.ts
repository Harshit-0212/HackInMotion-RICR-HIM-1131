export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export type GoalType = 'exam' | 'subject' | 'topic-mastery' | 'weak-areas' | 'placement';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  avatarColor: string;
  avatarImage?: string | null;
  createdAt: string;
  dailyStudyTargetMinutes: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  streakCount: number;
  xp: number;
  level: number;
}

export interface AvailableTime {
  hoursPerDay: number;
  studyDays: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface LearningGoal {
  id: string;
  type: GoalType;
  title: string;
  subjects: string[];
  topics: string[];
  deadline: string;
  availableTime: AvailableTime;
  knowledgeLevel: KnowledgeLevel;
  createdAt: string;
}

export type TopicStrength = 'critical' | 'weak' | 'moderate' | 'strong';

export interface Topic {
  id: string;
  name: string;
  subject: string;
  strength: number;
  strengthLabel: TopicStrength;
}

export interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type SessionStatus = 'completed' | 'in-progress' | 'upcoming' | 'locked' | 'missed';

export interface StudySession {
  id: string;
  day: number;
  date: string;
  topic: string;
  subject: string;
  objective: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: SessionStatus;
  conceptsTotal: number;
  conceptsDone: number;
  completedAt?: string;
}

export interface StudyPlan {
  id: string;
  goalTitle: string;
  examDate: string;
  totalStudyHours: number;
  completionPercent: number;
  sessions: StudySession[];
  lastAdaptedAt: string | null;
}

export interface ProgressSnapshot {
  overallCompletion: number;
  streakDays: number;
  hoursStudied: number;
  topicsMastered: number;
  weeklyActivity: { day: string; minutes: number }[];
  topicStrengths: Topic[];
  quizAccuracyTrend: { label: string; accuracy: number }[];
  consistencyPercent: number;
}

export interface ChatVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  video?: ChatVideo;
  attachmentName?: string;
  attachmentPreviewUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  goal?: number;
}

export interface SessionAssessmentQuestion {
  type: 'mcq' | 'true-false' | 'short-answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SessionUnderstandingEvaluation {
  understood: boolean;
  masteryLevel: 'strong' | 'developing' | 'weak';
  reasoning: string;
  weakConcepts: string[];
  reinforcementActivities: string[];
  recommendedRescheduleDays: number;
}

export interface DiagnosticEvaluation {
  knowledgeLevel: KnowledgeLevel;
  reasoning: string;
  weakTopics: string[];
}

export interface MockTestConfig {
  subject: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  numQuestions: number;
}

export interface MockTest {
  id: string;
  config: MockTestConfig;
  questions: Question[];
  createdAt: string;
  timeLimitSeconds: number;
}

export interface MockTestSubmission {
  answers: Record<string, string>;
}

export interface MockTestResult {
  testId: string;
  subject: string;
  takenAt: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  weakAreas: string[];
  perQuestion: { questionId: string; correct: boolean }[];
  topicBreakdown: { topic: string; correct: number; total: number }[];
}

export interface DocumentTopic {
  name: string;
  importance: 'high' | 'medium' | 'low';
  frequency: number;
}

export interface DocumentAnalysis {
  summary: string;
  topics: DocumentTopic[];
  chapters: string[];
  questionPatterns: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  priorities: string[];
}

export interface DocumentAnalysisResponse {
  documentId: string;
  fileName: string;
  analysis: DocumentAnalysis;
}

export interface StudyGroup {
  id: string;
  examName: string;
  topic: string;
  name: string;
  createdBy: string;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedUserId: string;
  invitedEmail: string;
  invitedByUserId: string;
  invitedByName: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}
