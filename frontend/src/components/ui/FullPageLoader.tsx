import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

interface FullPageLoaderProps {
  message?: string;
  submessage?: string;
}

export function FullPageLoader({
  message = 'Loading Cadence…',
  submessage = 'Preparing your intelligent workspace',
}: FullPageLoaderProps) {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--nova-bg)] dark:bg-[#0B1220] text-slate-800 dark:text-slate-100 transition-colors"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center animate-fade-in">
        <Logo size="lg" to="/app" />

        {/* Branded spinner ring */}
        <div className="relative flex items-center justify-center mt-2">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
            {message}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {submessage}
          </p>
        </div>

        {showSlowMessage && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-2 animate-fade-in">
            Connecting to workspace server… This may take an extra moment.
          </p>
        )}
      </div>
    </div>
  );
}

