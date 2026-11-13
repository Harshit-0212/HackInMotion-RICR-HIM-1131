import { Play, Pause, RotateCcw, X, Flame } from 'lucide-react';
import { usePomodoro } from '@/store/PomodoroContext';

export function MiniPomodoroTimer({ onOpenModal }: { onOpenModal?: () => void }) {
  const { isActive, mode, remainingSeconds, toggleTimer, resetTimer } = usePomodoro();

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/60 px-2.5 text-xs">
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 hover:text-[#6542C5] dark:hover:text-[#B59AF7] transition-colors"
        title="Open Pomodoro controls"
      >
        <Flame
          size={14}
          className={
            isActive
              ? 'text-[#D7713A] dark:text-[#F2B38C] animate-pulse'
              : 'text-[#5F5668] dark:text-[#B8AFBE]'
          }
        />
        <span
          className={`font-mono font-semibold text-xs ${
            isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#211D28] dark:text-[#F5F0E8]'
          }`}
        >
          {timeFormatted}
        </span>
        <span className="hidden md:inline-block text-[10px] uppercase font-bold px-1 rounded bg-[#D8D0C5]/60 dark:bg-[#141217]/60 text-[#5F5668] dark:text-[#B8AFBE]">
          {mode}
        </span>
      </button>

      <div className="flex items-center gap-0.5 ml-1 border-l border-[#D8D0C5]/80 dark:border-white/10 pl-1">
        <button
          onClick={toggleTimer}
          aria-label={isActive ? 'Pause Pomodoro' : 'Start Pomodoro'}
          className="p-1 rounded-md text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white hover:bg-[#D8D0C5]/40 dark:hover:bg-[#141217]/40 transition-colors"
        >
          {isActive ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={resetTimer}
          aria-label="Reset Pomodoro"
          className="p-1 rounded-md text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white hover:bg-[#D8D0C5]/40 dark:hover:bg-[#141217]/40 transition-colors"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}

