import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { randomId } from '@/utils/async';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success:
    'border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-900/40 dark:text-accent-100',
  error: 'border-error-100 bg-error-50 text-error-700 dark:border-error-700 dark:bg-error-700/20 dark:text-error-100',
  info: 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-100',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = randomId('toast');
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className={`flex items-start gap-3 rounded-xl2 border px-4 py-3 shadow-lift ${STYLES[toast.type]}`}
                role="status"
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                >
                  <X size={14} />
                </button>
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
