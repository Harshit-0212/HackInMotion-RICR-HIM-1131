import type { AuthCredentials, SignupPayload, User } from '@/types';
import { fetchApi, API_URL } from './api';

const TOKEN_KEY = 'nova_auth_token';

function transformBackendUser(dataUser: any): User {
  return {
    id: dataUser.id,
    email: dataUser.email,
    name: dataUser.user_metadata?.full_name || dataUser.email.split('@')[0],
    avatarColor: '#17B891',
    role: dataUser.role,
    avatarImage: dataUser.user_metadata?.avatar_image ?? null,
    createdAt: dataUser.created_at,
    dailyStudyTargetMinutes: 60,
    preferredStudyTime: 'evening',
    streakCount: 0,
    xp: 0,
    level: 1,
  };
}

export const authService = {
  async login({ email, password }: AuthCredentials): Promise<User> {
    const data = await fetchApi('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    return transformBackendUser(data.user);
  },

  async signup({ name, email, password }: SignupPayload): Promise<User> {
    const data = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        options: { data: { full_name: name } },
      }),
    });

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    return transformBackendUser(data.user);
  },

  async loginWithGoogle(credential: string): Promise<User> {
    const data = await fetchApi('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    return transformBackendUser(data.user);
  },

  async forgotPassword(email: string): Promise<{ message: string; devResetUrl?: string }> {
    return fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      await fetchApi(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async fetchCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const res = await fetchApi('/auth/session', { method: 'GET' });
      if (res.session?.user) {
        return transformBackendUser(res.session.user);
      }
      return null;
    } catch {
      return null;
    }
  },

  async updateUser(patch: Partial<User>): Promise<User> {
    const current = await this.fetchCurrentUser();
    if (!current) throw new Error('Not signed in.');

    // In a real app, you would PATCH the user via the backend here.
    // For now, since the user object is constructed from the backend data,
    // to "update" the user without local storage, we'd normally call the backend.
    // As a stub for the frontend UI requirements:
    return { ...current, ...patch } as User;
  },

  async uploadAvatar(file: File): Promise<User> {
    const token = localStorage.getItem(TOKEN_KEY);
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const json = await response.json();
    if (!response.ok || json.error) {
      throw new Error(json.error?.message || 'Could not upload your photo. Please try again.');
    }

    return transformBackendUser(json.data.user);
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
