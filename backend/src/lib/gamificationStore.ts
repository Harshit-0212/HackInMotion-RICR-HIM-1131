import { getDb } from './db.js';

export interface UserGamificationProfile {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD in user's local day
  streakFreezesAvailable: number; // Max 2
  streakFreezeUsedDates: string[]; // Dates when freeze was auto-consumed
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
    weekStartDate: string; // YYYY-MM-DD Monday
  }[];
  completedEventKeys?: string[]; // Idempotency ledger for discrete completed learning items
  createdAt: string;
  updatedAt: string;
}

export type LearningActionType =
  | 'coding_accepted'
  | 'comprehension_drill'
  | 'quiz_completed'
  | 'curriculum_step'
  | 'tutor_session';

const COLLECTION = 'user_gamification';

function calculateLevel(xp: number): number {
  let lvl = 1;
  while (50 * (lvl + 1) * lvl <= xp) {
    lvl++;
  }
  return lvl;
}

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function generateDefaultQuests(weekStart: string) {
  return [
    {
      id: 'quest_code_solve',
      title: 'Solve 2 Coding Problems',
      target: 2,
      current: 0,
      xpReward: 50,
      completed: false,
      weekStartDate: weekStart,
    },
    {
      id: 'quest_comprehension',
      title: 'Complete 3 Comprehension Drills',
      target: 3,
      current: 0,
      xpReward: 40,
      completed: false,
      weekStartDate: weekStart,
    },
    {
      id: 'quest_streak_3',
      title: 'Maintain a 3-Day Study Streak',
      target: 3,
      current: 0,
      xpReward: 60,
      completed: false,
      weekStartDate: weekStart,
    },
  ];
}

export const gamificationStore = {
  async getProfile(userId: string): Promise<UserGamificationProfile> {
    const db = await getDb();
    const col = db.collection<UserGamificationProfile>(COLLECTION);
    let doc = await col.findOne({ userId });
    const currentWeekStart = getMonday();

    if (!doc) {
      const now = new Date().toISOString();
      const initial: UserGamificationProfile = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        streakFreezesAvailable: 1, // Start with 1 friendly freeze
        streakFreezeUsedDates: [],
        totalXp: 0,
        level: 1,
        unlockedBadges: [],
        weeklyQuests: generateDefaultQuests(currentWeekStart),
        completedEventKeys: [],
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(initial);
      return initial;
    }

    if (!doc.weeklyQuests || doc.weeklyQuests[0]?.weekStartDate !== currentWeekStart) {
      const refreshedQuests = generateDefaultQuests(currentWeekStart);
      await col.updateOne(
        { userId },
        {
          $set: {
            weeklyQuests: refreshedQuests,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      doc.weeklyQuests = refreshedQuests;
    }

    return doc;
  },

  /**
   * Records a verified learning event.
   * eventKey is an optional unique identifier for the completed activity (e.g. problemSlug, drillId, quizId).
   * If provided and already recorded, XP, quest progress, and badges are not duplicated (idempotent).
   */
  async recordLearningEvent(
    userId: string,
    action: LearningActionType,
    userLocalDate: string, // "YYYY-MM-DD"
    eventKey?: string
  ): Promise<{
    profile: UserGamificationProfile;
    xpAwarded: number;
    streakIncreased: boolean;
    freezeUsed: boolean;
    newBadges: string[];
    isDuplicate: boolean;
  }> {
    const db = await getDb();
    const col = db.collection<UserGamificationProfile>(COLLECTION);
    const profile = await this.getProfile(userId);

    const fullKey = eventKey ? `${action}:${eventKey}` : undefined;
    const existingKeys = profile.completedEventKeys || [];

    // Idempotency check: if already awarded for this discrete event, return early without duplicate XP/badges
    if (fullKey && existingKeys.includes(fullKey)) {
      return {
        profile,
        xpAwarded: 0,
        streakIncreased: false,
        freezeUsed: false,
        newBadges: [],
        isDuplicate: true,
      };
    }

    const now = new Date().toISOString();
    let xpGained = 0;
    switch (action) {
      case 'coding_accepted':
        xpGained = 30;
        break;
      case 'comprehension_drill':
        xpGained = 20;
        break;
      case 'quiz_completed':
        xpGained = 25;
        break;
      case 'curriculum_step':
        xpGained = 15;
        break;
      case 'tutor_session':
        xpGained = 10;
        break;
    }

    // --- Streak calculation ---
    let newCurrentStreak = profile.currentStreak;
    let newLongestStreak = profile.longestStreak;
    let streakIncreased = false;
    let freezeUsed = false;
    let newFreezes = profile.streakFreezesAvailable;
    const freezeUsedDates = [...(profile.streakFreezeUsedDates || [])];

    if (!profile.lastActiveDate) {
      // First active day ever
      newCurrentStreak = 1;
      newLongestStreak = 1;
      streakIncreased = true;
    } else if (profile.lastActiveDate === userLocalDate) {
      // Already active today; streak remains unchanged
    } else {
      const last = new Date(profile.lastActiveDate);
      const curr = new Date(userLocalDate);
      const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day activity
        newCurrentStreak += 1;
        streakIncreased = true;
      } else if (diffDays === 2 && newFreezes > 0) {
        // Missed exactly 1 day and has freeze available: auto-protect streak!
        newFreezes -= 1;
        freezeUsed = true;
        freezeUsedDates.push(new Date(last.getTime() + 86400000).toISOString().slice(0, 10));
        newCurrentStreak += 1;
        streakIncreased = true;
      } else {
        // Missed more than 1 day or no freezes: reset streak to 1 for today
        newCurrentStreak = 1;
        streakIncreased = true;
      }
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    // --- XP & Level calculation ---
    const newTotalXp = profile.totalXp + xpGained;
    const newLevel = calculateLevel(newTotalXp);

    // --- Quest updates ---
    const updatedQuests = (profile.weeklyQuests || []).map((q) => {
      let progress = q.current;
      if (
        (q.id === 'quest_code_solve' && action === 'coding_accepted') ||
        (q.id === 'quest_comprehension' && action === 'comprehension_drill')
      ) {
        progress += 1;
      }
      if (q.id === 'quest_streak_3') {
        progress = Math.min(q.target, newCurrentStreak);
      }
      const completed = progress >= q.target;
      return { ...q, current: Math.min(progress, q.target), completed };
    });

    // --- Badges ---
    const newBadges: string[] = [];
    const unlocked = [...profile.unlockedBadges];
    const hasBadge = (id: string) => unlocked.some((b) => b.id === id);

    if (action === 'coding_accepted' && !hasBadge('badge_first_solve')) {
      const b = {
        id: 'badge_first_solve',
        title: 'Problem Solver',
        description: 'First accepted coding solution on Cadence',
        icon: 'code',
        unlockedAt: now,
      };
      unlocked.push(b);
      newBadges.push(b.title);
    }

    if (newCurrentStreak >= 7 && !hasBadge('badge_streak_7')) {
      const b = {
        id: 'badge_streak_7',
        title: 'Week Warrior',
        description: 'Maintained a 7-day study streak',
        icon: 'flame',
        unlockedAt: now,
      };
      unlocked.push(b);
      newBadges.push(b.title);
    }

    if (newTotalXp >= 200 && !hasBadge('badge_xp_200')) {
      const b = {
        id: 'badge_xp_200',
        title: 'Dedicated Learner',
        description: 'Accumulated over 200 study XP',
        icon: 'award',
        unlockedAt: now,
      };
      unlocked.push(b);
      newBadges.push(b.title);
    }

    const updatedEventKeys = fullKey ? [...existingKeys, fullKey] : existingKeys;

    const updatedProfile: UserGamificationProfile = {
      ...profile,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: userLocalDate,
      streakFreezesAvailable: newFreezes,
      streakFreezeUsedDates: freezeUsedDates,
      totalXp: newTotalXp,
      level: newLevel,
      unlockedBadges: unlocked,
      weeklyQuests: updatedQuests,
      completedEventKeys: updatedEventKeys,
      updatedAt: now,
    };

    await col.updateOne({ userId }, { $set: updatedProfile });

    return {
      profile: updatedProfile,
      xpAwarded: xpGained,
      streakIncreased,
      freezeUsed,
      newBadges,
      isDuplicate: false,
    };
  },
};
