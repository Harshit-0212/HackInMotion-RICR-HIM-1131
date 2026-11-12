import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from 'lucide-react';
import { randomId } from '@/utils/async';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (message: string, optionsOrType?: ToastType | ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success:
    'border-[#2F855A]/30 bg-[#F2FAF5] text-[#2F855A] dark:border-[#48BB78]/30 dark:bg-[#1D1922] dark:text-[#48BB78]',
  error:
    'border-[#E53E3E]/30 bg-[#FFF5F5] text-[#E53E3E] dark:border-[#FC8181]/30 dark:bg-[#1D1922] dark:text-[#FC8181]',
  info:
    'border-[#6542C5]/30 bg-[#F5F3FD] text-[#6542C5] dark:border-[#B59AF7]/30 dark:bg-[#1D1922] dark:text-[#B59AF7]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, optionsOrType?: ToastType | ToastOptions) => {
      const id = randomId('toast');
      const opts: ToastOptions =
        typeof optionsOrType === 'string'
          ? { type: optionsOrType }
          : optionsOrType || { type: 'success' };

      const type = opts.type || 'success';
      const duration = opts.duration ?? (opts.action ? 6000 : 4200);

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          message,
          action: opts.action,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6 pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md ${
                  STYLES[toast.type]
                }`}
                role="status"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={18} className="shrink-0" />
                  <p className="text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] truncate">
                    {toast.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action?.onClick();
                        dismissToast(toast.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#6542C5] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#51329F] dark:bg-[#B59AF7] dark:text-[#141217] dark:hover:bg-[#C6AFFB] transition-colors"
                    >
                      <Undo2 size={12} />
                      <span>{toast.action.label}</span>
                    </button>
                  )}

                  <button
                    onClick={() => dismissToast(toast.id)}
                    aria-label="Dismiss notification"
                    className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
