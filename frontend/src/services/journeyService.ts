/**
 * Frontend service for the learning journey system.
 * All calls go through the authenticated fetchApi helper.
 */
import { fetchApi } from './api';
import type {
  Journey,
  Stage,
  Activity,
  StudentJourneyProgress,
  CheckpointAttempt,
  GradedAttempt,
  ComprehensionResult,
  PracticeSubmitResult,
  CheckpointJudgeResult,
} from '@/types/journey';

const BASE = '/learn';

export const journeyService = {
  // ── Journeys ──────────────────────────────────────────────────────────────

  async listJourneys(): Promise<Journey[]> {
    return fetchApi(`${BASE}/journeys`);
  },

  async getJourney(slug: string): Promise<Journey> {
    return fetchApi(`${BASE}/journeys/${slug}`);
  },

  // ── Progress ──────────────────────────────────────────────────────────────

  async getProgress(journeySlug: string): Promise<StudentJourneyProgress> {
    return fetchApi(`${BASE}/journeys/${journeySlug}/progress`);
  },

  // ── Stages ────────────────────────────────────────────────────────────────

  async listStages(journeySlug: string): Promise<Stage[]> {
    return fetchApi(`${BASE}/journeys/${journeySlug}/stages`);
  },

  async getStage(stageSlug: string): Promise<Stage> {
    return fetchApi(`${BASE}/stages/${stageSlug}`);
  },

  // ── Activities ────────────────────────────────────────────────────────────

  async listActivities(stageSlug: string): Promise<Activity[]> {
    return fetchApi(`${BASE}/stages/${stageSlug}/activities`);
  },

  async getActivity(activityId: string): Promise<Activity> {
    return fetchApi(`${BASE}/activities/${activityId}`);
  },

  async completeActivity(activityId: string): Promise<void> {
    await fetchApi(`${BASE}/activities/${activityId}/complete`, { method: 'POST' });
  },

  // ── Comprehension ─────────────────────────────────────────────────────────

  async submitComprehensionAnswer(
    activityId: string,
    answer: string,
  ): Promise<ComprehensionResult> {
    return fetchApi(`${BASE}/activities/${activityId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  // ── Practice submit ───────────────────────────────────────────────────────

  async submitPractice(
    journeySlug: string,
    problemSlug: string,
    language: string,
    code: string,
  ): Promise<PracticeSubmitResult> {
    return fetchApi(`${BASE}/journeys/${journeySlug}/practice/${problemSlug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    });
  },

  // ── Checkpoint ────────────────────────────────────────────────────────────

  async startCheckpoint(stageSlug: string): Promise<CheckpointAttempt> {
    return fetchApi(`${BASE}/stages/${stageSlug}/checkpoint/start`, { method: 'POST' });
  },

  async saveCheckpointProgress(
    attemptId: string,
    knowledgeAnswers: Record<string, string>,
  ): Promise<void> {
    await fetchApi(`${BASE}/checkpoint-attempts/${attemptId}/save`, {
      method: 'PATCH',
      body: JSON.stringify({ knowledgeAnswers }),
    });
  },

  async submitCheckpoint(
    attemptId: string,
    knowledgeAnswers: Record<string, string>,
  ): Promise<GradedAttempt> {
    return fetchApi(`${BASE}/checkpoint-attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ knowledgeAnswers }),
    });
  },

  async judgeCheckpointCodingTask(
    attemptId: string,
    problemId: string,
    language: string,
    code: string,
  ): Promise<CheckpointJudgeResult> {
    return fetchApi(`${BASE}/checkpoint-attempts/${attemptId}/judge/${problemId}`, {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    });
  },
};

