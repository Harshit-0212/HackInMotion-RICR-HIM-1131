import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  Achievement,
  DiagnosticEvaluation,
  DocumentAnalysisResponse,
  LearningGoal,
  MockTest,
  MockTestConfig,
  MockTestResult,
  ProgressSnapshot,
  SessionAssessmentQuestion,
  SessionUnderstandingEvaluation,
  StudyPlan,
} from '@/types';
import { goalService, type CreateGoalInput } from '@/services/goalService';
import { studyPlanService } from '@/services/studyPlanService';
import { progressService } from '@/services/progressService';
import { mockTestService } from '@/services/mockTestService';
import { documentService } from '@/services/documentService';
import { useToast } from '@/store/ToastContext';
import { clearStorage } from '@/utils/storage';

// These keys held goals/plans/progress client-side before that data moved to MongoDB.
// Nothing writes to them anymore; this purges any leftovers from older sessions.
const OBSOLETE_LOCAL_KEYS = ['nova_goal', 'nova_available_time', 'nova_knowledge_level', 'nova_study_plan', 'nova_mock_test_results'];
import { useAuth } from '@/store/AuthContext';
import type { StudySession } from '@/types';

interface AppDataContextValue {
  goal: LearningGoal | null;
  plan: StudyPlan | null;
  progress: ProgressSnapshot | null;
  achievements: Achievement[];
  weakTopics: string[];
  quizHistory: MockTestResult[];
  isReady: boolean;

  createGoal: (input: CreateGoalInput) => Promise<LearningGoal>;
  runDiagnostic: (subjects: string[], topics: string[], documentId?: string) => Promise<SessionAssessmentQuestion[]>;
  evaluateDiagnostic: (
    subjects: string[],
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ) => Promise<DiagnosticEvaluation>;
  generatePlan: () => Promise<StudyPlan>;

  markSessionComplete: (sessionId: string) => Promise<void>;
  rescheduleSession: (sessionId: string, newDate: string) => Promise<void>;
  autoAdjustPlan: () => Promise<void>;
  generateSessionAssessment: (
    session: StudySession,
    supplementaryMaterial?: string,
  ) => Promise<SessionAssessmentQuestion[]>;
  evaluateSessionUnderstanding: (
    sessionId: string,
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ) => Promise<SessionUnderstandingEvaluation>;
  resetPlan: () => Promise<void>;

  generateMockTest: (config: MockTestConfig) => Promise<MockTest>;
  submitMockTest: (
    test: MockTest,
    answers: Record<string, string>,
    timeSpentSeconds?: number,
  ) => Promise<MockTestResult>;
  suggestTopicsFor: (subject: string) => Promise<string[]>;

  analyzeDocument: (file: File) => Promise<DocumentAnalysisResponse>;
  generateMockTestFromDocument: (
    documentId: string,
    fileName: string,
    config: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
  ) => Promise<MockTest>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [quizHistory, setQuizHistory] = useState<MockTestResult[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshProgress = async () => {
    const [{ snapshot, achievements: unlockedAchievements, weakTopics: weak }, results] = await Promise.all([
      progressService.getAll(),
      mockTestService.getResults(),
    ]);
    setProgress(snapshot);
    setAchievements(unlockedAchievements);
    setWeakTopics(weak);
    setQuizHistory([...results].reverse());
  };

  useEffect(() => {
    OBSOLETE_LOCAL_KEYS.forEach(clearStorage);
  }, []);

  useEffect(() => {
    if (!user) {
      setGoal(null);
      setPlan(null);
      setProgress(null);
      setAchievements([]);
      setWeakTopics([]);
      setQuizHistory([]);
      setIsReady(true);
      return;
    }
    setIsReady(false);
    (async () => {
      // Fetch all dashboard data in parallel — no sequential waterfall.
      const [
        existingGoal,
        existingPlan,
        { snapshot, achievements: unlockedAchievements, weakTopics: weak },
        results,
      ] = await Promise.all([
        goalService.getCurrent(),
        studyPlanService.getPlan(),
        progressService.getAll(),
        mockTestService.getResults(),
      ]);
      setGoal(existingGoal);
      setPlan(existingPlan);
      setProgress(snapshot);
      setAchievements(unlockedAchievements);
      setWeakTopics(weak);
      setQuizHistory([...results].reverse());
      setIsReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const resetPlan = async () => {
    await goalService.resetGoal();
    setGoal(null);
    setPlan(null);
  };

  const createGoal = async (input: CreateGoalInput) => {
    const created = await goalService.createGoal(input);
    setGoal(created);
    showToast('Learning goal created.');
    return created;
  };

  const runDiagnostic = async (subjects: string[], topics: string[], documentId?: string) => {
    return goalService.runDiagnostic(subjects, topics, documentId);
  };

  const evaluateDiagnostic = async (
    subjects: string[],
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ) => {
    return goalService.evaluateDiagnostic(subjects, qa);
  };

  const generatePlan = async () => {
    const generated = await studyPlanService.generatePlan();
    setPlan(generated);
    showToast('Your personalized study plan is ready.');
    await refreshProgress();
    return generated;
  };

  const markSessionComplete = async (sessionId: string) => {
    const updated = await studyPlanService.markSessionComplete(sessionId);
    setPlan(updated);
    showToast('Session marked complete. Great work!');
    await refreshProgress();
  };

  const rescheduleSession = async (sessionId: string, newDate: string) => {
    const updated = await studyPlanService.rescheduleSession(sessionId, newDate);
    setPlan(updated);
    showToast('Session rescheduled.');
  };

  const autoAdjustPlan = async () => {
    const updated = await studyPlanService.autoAdjustPlan();
    setPlan(updated);
    showToast('Your plan has been adapted to get you back on track.');
    await refreshProgress();
  };

  const generateSessionAssessment = async (session: StudySession, supplementaryMaterial?: string) => {
    return studyPlanService.generateSessionAssessment(session, supplementaryMaterial);
  };

  const evaluateSessionUnderstanding = async (
    sessionId: string,
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ) => {
    const { evaluation, plan: updatedPlan } = await studyPlanService.evaluateSessionUnderstanding(sessionId, qa);
    if (updatedPlan) setPlan(updatedPlan);
    await refreshProgress();
    return evaluation;
  };

  const generateMockTest = async (config: MockTestConfig) => {
    return mockTestService.generateTest(config);
  };

  const submitMockTest = async (test: MockTest, answers: Record<string, string>, timeSpentSeconds = 0) => {
    const result = await mockTestService.submitTest(test, { answers }, timeSpentSeconds);
    showToast('Mock test submitted.');
    await refreshProgress();
    return result;
  };

  const suggestTopicsFor = async (subject: string) => {
    return mockTestService.suggestTopics(subject, weakTopics);
  };

  const analyzeDocument = async (file: File) => {
    return documentService.analyze(file);
  };

  const generateMockTestFromDocument = async (
    documentId: string,
    fileName: string,
    config: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
  ) => {
    const test = await documentService.generateMockTestFromDocument(documentId, fileName, config);
    showToast('Mock test generated from your document.');
    return test;
  };

  return (
    <AppDataContext.Provider
      value={{
        goal,
        plan,
        progress,
        achievements,
        weakTopics,
        quizHistory,
        isReady,
        createGoal,
        runDiagnostic,
        evaluateDiagnostic,
        generatePlan,
        markSessionComplete,
        rescheduleSession,
        autoAdjustPlan,
        generateSessionAssessment,
        evaluateSessionUnderstanding,
        generateMockTest,
        submitMockTest,
        suggestTopicsFor,
        analyzeDocument,
        generateMockTestFromDocument,
        resetPlan,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
