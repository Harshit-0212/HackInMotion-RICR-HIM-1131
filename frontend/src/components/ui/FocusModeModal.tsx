import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Flame } from 'lucide-react';
import { usePomodoro } from '@/store/PomodoroContext';

export function FocusModeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    isActive,
    mode,
    durationMinutes,
    remainingSeconds,
    toggleTimer,
    resetTimer,
    setMode,
  } = usePomodoro();

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const totalDuration = durationMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - remainingSeconds) / totalDuration) * 100))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="relative w-full max-w-md rounded-3xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-8 text-center shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 text-[#8A8192] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6542C5] dark:text-[#B59AF7]">
              <Flame size={16} /> Focus Mode (Pomodoro)
            </div>

            {/* Mode selection tabs */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  setMode('work');
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'work'
                    ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                    : 'bg-[#E8E1D7] text-[#5F5668] dark:bg-[#28222F] dark:text-[#B8AFBE]'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => {
                  setMode('break');
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'break'
                    ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                    : 'bg-[#E8E1D7] text-[#5F5668] dark:bg-[#28222F] dark:text-[#B8AFBE]'
                }`}
              >
                Break (5m)
              </button>
            </div>

            <div className="my-8">
              <div className="font-space text-6xl font-bold tracking-tight text-[#211D28] dark:text-[#F5F0E8]">
                {timeFormatted}
              </div>
              <p className="mt-2 text-xs text-[#5F5668] dark:text-[#B8AFBE]">
                {mode === 'work' ? 'Deep Study Interval · Stay Focused' : 'Short Break · Relax and breathe'}
              </p>
            </div>

            {/* Progress bar indicator */}
            <div className="mb-6 h-2 w-full rounded-full bg-[#E8E1D7] dark:bg-[#28222F] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6542C5] dark:bg-[#B59AF7] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleTimer}
                className="inline-flex h-12 w-28 items-center justify-center gap-2 rounded-2xl bg-[#6542C5] text-white font-bold hover:bg-[#51329F] dark:bg-[#B59AF7] dark:text-[#141217] dark:hover:bg-[#C6AFFB] shadow-md transition-colors"
              >
                {isActive ? <Pause size={18} /> : <Play size={18} />}
                <span>{isActive ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={resetTimer}
                aria-label="Reset timer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D8D0C5] dark:border-white/10 text-[#5F5668] dark:text-[#B8AFBE] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
