import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { activityService } from '@/services/activityService';
import { useToast } from '@/store/ToastContext';

export interface PomodoroState {
  isActive: boolean;
  mode: 'work' | 'break';
  durationMinutes: number;
  endsAt: number | null; // epoch timestamp ms
  remainingSeconds: number;
}

interface PomodoroContextValue extends PomodoroState {
  startTimer: (durationMinutes?: number, mode?: 'work' | 'break') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  toggleTimer: () => void;
  setMode: (mode: 'work' | 'break') => void;
}

const STORAGE_KEY = 'cadence_pomodoro_state_v1';

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  const [state, setState] = useState<PomodoroState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.endsAt && parsed.isActive) {
          const rem = Math.max(0, Math.round((parsed.endsAt - Date.now()) / 1000));
          return {
            ...parsed,
            remainingSeconds: rem,
            isActive: rem > 0,
          };
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
    return {
      isActive: false,
      mode: 'work',
      durationMinutes: 25,
      endsAt: null,
      remainingSeconds: 25 * 60,
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }, [state]);

  // Handle completion audio & activity log
  const handleComplete = async (completedMode: 'work' | 'break', duration: number) => {
    // Play sound safely
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio not permitted or supported
    }

    if (completedMode === 'work') {
      showToast('Focus session complete! Take a well-deserved break.', 'success');
      // Idempotently log activity points (1 point per 25 min)
      const eventKey = `focus_${Date.now()}`;
      try {
        await activityService.recordActivity('focus', Math.max(1, Math.round(duration / 25)), {
          minutes: duration,
        }, eventKey);
      } catch {
        // Continue
      }
      // Auto-switch to break
      const breakSecs = 5 * 60;
      setState({
        isActive: false,
        mode: 'break',
        durationMinutes: 5,
        endsAt: null,
        remainingSeconds: breakSecs,
      });
    } else {
      showToast('Break finished! Ready to focus again?', 'info');
      const workSecs = 25 * 60;
      setState({
        isActive: false,
        mode: 'work',
        durationMinutes: 25,
        endsAt: null,
        remainingSeconds: workSecs,
      });
    }
  };

  // Main countdown ticker based on Date.now()
  useEffect(() => {
    if (!state.isActive || !state.endsAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((state.endsAt! - now) / 1000));

      if (diff <= 0) {
        clearInterval(interval);
        handleComplete(state.mode, state.durationMinutes);
      } else {
        setState((prev) => ({ ...prev, remainingSeconds: diff }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [state.isActive, state.endsAt, state.mode, state.durationMinutes]);

  // Update document title with remaining time
  useEffect(() => {
    if (state.isActive) {
      const m = Math.floor(state.remainingSeconds / 60);
      const s = state.remainingSeconds % 60;
      const f = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      document.title = `(${f}) Cadence - ${state.mode === 'work' ? 'Focus' : 'Break'}`;
    } else {
      document.title = 'Cadence — AI Learning Assistant & Study Planner';
    }
  }, [state.isActive, state.remainingSeconds, state.mode]);

  const startTimer = (durationMinutes = state.durationMinutes, mode: 'work' | 'break' = state.mode) => {
    const totalSecs = durationMinutes * 60;
    const endsAt = Date.now() + totalSecs * 1000;
    setState({
      isActive: true,
      mode,
      durationMinutes,
      endsAt,
      remainingSeconds: totalSecs,
    });
  };

  const pauseTimer = () => {
    if (!state.isActive) return;
    setState((prev) => ({
      ...prev,
      isActive: false,
      endsAt: null,
    }));
  };

  const resumeTimer = () => {
    if (state.isActive) return;
    const endsAt = Date.now() + state.remainingSeconds * 1000;
    setState((prev) => ({
      ...prev,
      isActive: true,
      endsAt,
    }));
  };

  const resetTimer = () => {
    const totalSecs = state.durationMinutes * 60;
    setState((prev) => ({
      ...prev,
      isActive: false,
      endsAt: null,
      remainingSeconds: totalSecs,
    }));
  };

  const toggleTimer = () => {
    if (state.isActive) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const setMode = (mode: 'work' | 'break') => {
    const duration = mode === 'work' ? 25 : 5;
    setState({
      isActive: false,
      mode,
      durationMinutes: duration,
      endsAt: null,
      remainingSeconds: duration * 60,
    });
  };

  return (
    <PomodoroContext.Provider
      value={{
        ...state,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        toggleTimer,
        setMode,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return ctx;
}

