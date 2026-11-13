import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthCredentials, SignupPayload, User } from '@/types';
import { authService } from '@/services/authService';
import { activityService } from '@/services/activityService';
import { connectSocket, disconnectSocket } from '@/services/socket';

interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  login: (credentials: AuthCredentials) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    authService.fetchCurrentUser().then((fetchedUser) => {
      setUser(fetchedUser);
      setIsInitializing(false);
      const token = authService.getToken();
      if (fetchedUser && token) {
        connectSocket(token);
        // Daily idempotent checkin for streaks
        activityService.checkin().catch(() => {});
      }
    });
  }, []);

  const login = async (credentials: AuthCredentials) => {
    const loggedIn = await authService.login(credentials);
    setUser(loggedIn);
    const token = authService.getToken();
    if (token) {
      connectSocket(token);
      activityService.checkin().catch(() => {});
    }
    return loggedIn;
  };

  const signup = async (payload: SignupPayload) => {
    const created = await authService.signup(payload);
    setUser(created);
    const token = authService.getToken();
    if (token) {
      connectSocket(token);
      activityService.checkin().catch(() => {});
    }
    return created;
  };

  const loginWithGoogle = async (credential: string) => {
    const loggedIn = await authService.loginWithGoogle(credential);
    setUser(loggedIn);
    const token = authService.getToken();
    if (token) {
      connectSocket(token);
      activityService.checkin().catch(() => {});
    }
    return loggedIn;
  };

  const logout = () => {
    authService.logout();
    disconnectSocket();
    setUser(null);
  };

  const updateUser = async (patch: Partial<User>) => {
    const updated = await authService.updateUser(patch);
    setUser(updated);
  };

  const uploadAvatar = async (file: File) => {
    const updated = await authService.uploadAvatar(file);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, login, signup, loginWithGoogle, logout, updateUser, uploadAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
