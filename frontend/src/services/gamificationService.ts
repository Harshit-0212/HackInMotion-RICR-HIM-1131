import { fetchApi } from './api';

export interface UserGamificationData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakFreezesAvailable: number;
  streakFreezeUsedDates: string[];
  totalXp: number;
  level: number;
  unlockedBadges: {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  weeklyQuests: {
    id: string;
    title: string;
    target: number;
    current: number;
    xpReward: number;
    completed: boolean;
    weekStartDate: string;
  }[];
}

export const gamificationService = {
  async getProfile(): Promise<UserGamificationData> {
    return fetchApi('/gamification/profile');
  },

  async recordEvent(action: 'coding_accepted' | 'comprehension_drill' | 'quiz_completed' | 'curriculum_step' | 'tutor_session'): Promise<{
    profile: UserGamificationData;
    xpAwarded: number;
    streakIncreased: boolean;
    freezeUsed: boolean;
    newBadges: string[];
  }> {
    const localDate = new Date().toISOString().slice(0, 10);
    return fetchApi('/gamification/events', {
      method: 'POST',
      body: JSON.stringify({ action, localDate }),
    });
  },
};
