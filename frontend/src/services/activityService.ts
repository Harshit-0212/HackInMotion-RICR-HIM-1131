import { fetchApi } from './api';

export interface ActivityDayItem {
  type: string;
  points: number;
  time: string;
  title?: string;
}

export interface ActivityDailyData {
  totalPoints: number;
  count: number;
  breakdown: Record<string, number>;
  items: ActivityDayItem[];
}

export interface ActivityResponse {
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  totalPoints: number;
  dailyData: Record<string, ActivityDailyData>;
}

export const activityService = {
  getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  },

  getUserLocalDate(): string {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: this.getUserTimezone() }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  },

  async checkin(): Promise<{ currentStreak: number; longestStreak: number; dateKey: string }> {
    const res = (await fetchApi('/activity/checkin', {
      method: 'POST',
      body: JSON.stringify({
        timezone: this.getUserTimezone(),
        localDate: this.getUserLocalDate(),
      }),
    })) as any;
    return res.data;
  },

  async recordActivity(
    type: string,
    points?: number,
    meta?: Record<string, unknown>,
    eventKey?: string
  ): Promise<{ recorded: boolean; currentStreak: number; longestStreak: number }> {
    const res = (await fetchApi('/activity/record', {
      method: 'POST',
      body: JSON.stringify({
        type,
        points,
        meta,
        eventKey,
        timezone: this.getUserTimezone(),
        localDate: this.getUserLocalDate(),
      }),
    })) as any;
    return res.data;
  },

  async getActivity(year?: number, month?: number, type?: string): Promise<ActivityResponse> {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    if (type && type !== 'all') params.set('type', type);
    params.set('timezone', this.getUserTimezone());
    params.set('localDate', this.getUserLocalDate());

    const res = (await fetchApi(`/activity?${params.toString()}`)) as any;
    return res.data;
  },
};

