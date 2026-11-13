import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Flame,
  Award,
  Calendar as CalendarIcon,
  Zap,
  RotateCcw,
  Grid,
  Disc,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  activityService,
  type ActivityResponse,
  type ActivityDailyData,
} from '@/services/activityService';

export interface ActivityHeatmapProps {
  compact?: boolean;
}

// 5 activity level colors in violet / purple palette (dark forest & violet)
const COLOR_LEVELS = [
  'var(--heatmap-level-0, #E8E1D7)',
  'var(--heatmap-level-1, #DDD6FE)',
  'var(--heatmap-level-2, #C4B5FD)',
  'var(--heatmap-level-3, #8B5CF6)',
  'var(--heatmap-level-4, #6D28D9)',
  'var(--heatmap-level-5, #4C1D95)',
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'session', label: 'Study' },
  { id: 'mock_test', label: 'Tests' },
  { id: 'flashcard', label: 'Flashcards' },
  { id: 'interview', label: 'Interviews' },
  { id: 'coding_submission', label: 'Coding' },
];

export function ActivityHeatmap({ compact = false }: ActivityHeatmapProps) {
  const shouldReduceMotion = useReducedMotion();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'radial' | 'grid'>('radial');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Portal tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    info: ActivityDailyData | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    info: null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await activityService.getActivity(selectedYear, undefined, activeFilter);
      setData(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, activeFilter]);

  // Generate all 365/366 days for the year
  const daysOfYear = useMemo(() => {
    const days: { dateKey: string; month: number; day: number; dayOfWeek: number }[] = [];
    const isLeap = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || selectedYear % 400 === 0;
    const totalDays = isLeap ? 366 : 365;

    const start = new Date(Date.UTC(selectedYear, 0, 1));
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      days.push({
        dateKey,
        month: d.getUTCMonth(),
        day: d.getUTCDate(),
        dayOfWeek: d.getUTCDay(), // 0 = Sun, 1 = Mon ...
      });
    }
    return days;
  }, [selectedYear]);

  // Points to level (0-5)
  const getLevel = (points: number): number => {
    if (!points || points <= 0) return 0;
    if (points <= 2) return 1;
    if (points <= 5) return 2;
    if (points <= 9) return 3;
    if (points <= 14) return 4;
    return 5;
  };

  const getColor = (points: number) => {
    const lvl = getLevel(points);
    return COLOR_LEVELS[lvl];
  };

  const handleCellHover = (e: React.MouseEvent, dateKey: string) => {
    const dayData = data?.dailyData?.[dateKey] || null;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: dateKey,
      info: dayData,
    });
  };

  const handleCellLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleCellClick = (dateKey: string) => {
    setSelectedDayKey((prev) => (prev === dateKey ? null : dateKey));
  };

  const selectedDayDetails = selectedDayKey && data?.dailyData?.[selectedDayKey];

  return (
    <div className="w-full rounded-3xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-5 md:p-7 shadow-sm">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#D8D0C5]/60 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#6542C5] dark:bg-[#B59AF7]" />
            <h3 className="font-bold text-base md:text-lg text-[#211D28] dark:text-[#F5F0E8]">
              Learning Activity & Consistency
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#5F5668] dark:text-[#B8AFBE]">
            Radial activity spectrum reflecting sessions, tests, drills and focus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs font-semibold text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          {!compact && (
            <div className="flex rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] p-0.5">
              <button
                onClick={() => setViewMode('radial')}
                aria-label="Radial view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'radial'
                    ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                    : 'text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE]'
                }`}
                title="Radial Heatmap"
              >
                <Disc size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                    : 'text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE]'
                }`}
                title="Matrix View"
              >
                <Grid size={14} />
              </button>
            </div>
          )}

          {/* Replay Sweep Animation */}
          {viewMode === 'radial' && (
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              aria-label="Replay animation"
              className="p-1.5 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white transition-colors"
              title="Replay sweep animation"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 py-4 border-b border-[#D8D0C5]/40 dark:border-white/5">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === f.id
                  ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217] shadow-xs'
                  : 'bg-[#E8E1D7]/60 dark:bg-[#28222F]/50 text-[#5F5668] dark:text-[#B8AFBE] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-2xl bg-[#F1EDE6] dark:bg-[#141217] border border-[#D8D0C5]/40 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-[#8A8192]">
            <Flame size={13} className="text-[#D7713A] dark:text-[#F2B38C]" />
            <span>Current Streak</span>
          </div>
          <div className="mt-1 font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
            {data?.currentStreak ?? 0} <span className="text-xs font-normal">days</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F1EDE6] dark:bg-[#141217] border border-[#D8D0C5]/40 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-[#8A8192]">
            <Award size={13} className="text-[#6542C5] dark:text-[#B59AF7]" />
            <span>Longest Streak</span>
          </div>
          <div className="mt-1 font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
            {data?.longestStreak ?? 0} <span className="text-xs font-normal">days</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F1EDE6] dark:bg-[#141217] border border-[#D8D0C5]/40 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-[#8A8192]">
            <CalendarIcon size={13} className="text-[#2F855A] dark:text-[#48BB78]" />
            <span>Active Days</span>
          </div>
          <div className="mt-1 font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
            {data?.activeDaysCount ?? 0} <span className="text-xs font-normal">in {selectedYear}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F1EDE6] dark:bg-[#141217] border border-[#D8D0C5]/40 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-[#8A8192]">
            <Zap size={13} className="text-[#D97706] dark:text-[#FBBF24]" />
            <span>Activity Points</span>
          </div>
          <div className="mt-1 font-space text-2xl font-bold text-[#211D28] dark:text-[#F5F0E8]">
            {data?.totalPoints ?? 0} <span className="text-xs font-normal">pts</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualization */}
      <div className="relative my-4 flex flex-col items-center justify-center min-h-[340px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6542C5] border-t-transparent dark:border-[#B59AF7]" />
            <p className="text-xs text-[#8A8192]">Rendering consistency spectrum...</p>
          </div>
        ) : viewMode === 'radial' ? (
          <RadialHeatmapView
            key={replayKey}
            days={daysOfYear}
            data={data}
            compact={compact}
            shouldReduceMotion={shouldReduceMotion}
            onHover={handleCellHover}
            onLeave={handleCellLeave}
            onClick={handleCellClick}
          />
        ) : (
          <GridHeatmapView
            days={daysOfYear}
            data={data}
            onHover={handleCellHover}
            onLeave={handleCellLeave}
            onClick={handleCellClick}
          />
        )}
      </div>

      {/* Selected Day Drawer / Breakdown */}
      <AnimatePresence>
        {selectedDayKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-[#D8D0C5] dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6542C5] dark:text-[#B59AF7]">
                Log Breakdown for {selectedDayKey}
              </h4>
              <button
                onClick={() => setSelectedDayKey(null)}
                aria-label="Close day breakdown"
                className="p-1 rounded-lg hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] text-[#8A8192]"
              >
                <X size={14} />
              </button>
            </div>

            {selectedDayDetails && selectedDayDetails.items.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {selectedDayDetails.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-[#D8D0C5]/40 dark:border-white/5 bg-[#F1EDE6]/60 dark:bg-[#141217] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#211D28] dark:text-[#F5F0E8] capitalize">
                        {it.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-[#8A8192]">{it.time}</p>
                    </div>
                    <span className="font-mono font-bold text-[#6542C5] dark:text-[#B59AF7]">
                      +{it.points} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-xs text-[#8A8192]">
                No recorded learning activities for this date.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D8D0C5]/40 dark:border-white/5 text-xs text-[#8A8192]">
        <span>Tap any segment to inspect day log</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {COLOR_LEVELS.map((col, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-sm border border-black/5"
              style={{ backgroundColor: col }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Floating Tooltip in Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {tooltip.visible && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#211D28] dark:bg-[#FBF8F2] text-[#F5F0E8] dark:text-[#211D28] px-3 py-2 text-xs shadow-xl"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <p className="font-bold">{tooltip.date}</p>
                {tooltip.info ? (
                  <div className="mt-1 space-y-0.5 text-[11px] opacity-90">
                    <p className="font-semibold text-[#B59AF7] dark:text-[#6542C5]">
                      {tooltip.info.totalPoints} points · {tooltip.info.count} activities
                    </p>
                    {Object.entries(tooltip.info.breakdown).map(([k, count]) => (
                      <p key={k} className="capitalize text-[10px]">
                        {k.replace('_', ' ')}: {count}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 text-[10px] opacity-75">No activity recorded</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

// ==========================================
// RADIAL VIEW (Concentric rings for 7 weekdays)
// ==========================================
function RadialHeatmapView({
  days,
  data,
  compact,
  shouldReduceMotion,
  onHover,
  onLeave,
  onClick,
}: {
  days: { dateKey: string; month: number; day: number; dayOfWeek: number }[];
  data: ActivityResponse | null;
  compact: boolean;
  shouldReduceMotion: boolean | null;
  onHover: (e: React.MouseEvent, dateKey: string) => void;
  onLeave: () => void;
  onClick: (dateKey: string) => void;
}) {
  const size = compact ? 340 : 420;
  const center = size / 2;
  const innerRadius = compact ? 50 : 65;
  const ringWidth = compact ? 9 : 12;
  const ringGap = 2;

  // 7 rings: 0=Mon, 1=Tue, ..., 6=Sun
  // Weeks around circle: 53 weeks
  // Week index = Math.floor(dayOfYear / 7)
  const anglePerWeek = (2 * Math.PI) / 53;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Month labels around edge */}
        {[
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ].map((m, idx) => {
          const angle = (idx / 12) * 2 * Math.PI - Math.PI / 2;
          const labelRadius = innerRadius + 7 * (ringWidth + ringGap) + 14;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={m}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] font-bold fill-[#8A8192] select-none uppercase tracking-wider"
            >
              {m}
            </text>
          );
        })}

        {/* Days as curved / segment arc blocks */}
        {days.map((d, index) => {
          // Ring: 0=Sun, 1=Mon, ..., 6=Sat
          const ringIndex = (d.dayOfWeek + 6) % 7; // Mon=0 .. Sun=6
          const weekIndex = Math.floor(index / 7);

          const r = innerRadius + ringIndex * (ringWidth + ringGap);
          const startAngle = (weekIndex / 53) * 2 * Math.PI - Math.PI / 2;
          const endAngle = startAngle + anglePerWeek * 0.85;

          const x1 = center + r * Math.cos(startAngle);
          const y1 = center + r * Math.sin(startAngle);
          const x2 = center + r * Math.cos(endAngle);
          const y2 = center + r * Math.sin(endAngle);

          const rOuter = r + ringWidth;
          const x3 = center + rOuter * Math.cos(endAngle);
          const y3 = center + rOuter * Math.sin(endAngle);
          const x4 = center + rOuter * Math.cos(startAngle);
          const y4 = center + rOuter * Math.sin(startAngle);

          const pathD = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rOuter} ${rOuter} 0 0 0 ${x4} ${y4} Z`;

          const dayData = data?.dailyData?.[d.dateKey];
          const pts = dayData?.totalPoints || 0;

          // Color
          let fill = '#E8E1D7';
          if (pts > 0) {
            if (pts <= 2) fill = '#DDD6FE';
            else if (pts <= 5) fill = '#C4B5FD';
            else if (pts <= 9) fill = '#8B5CF6';
            else if (pts <= 14) fill = '#6D28D9';
            else fill = '#4C1D95';
          }

          return (
            <path
              key={d.dateKey}
              d={pathD}
              fill={fill}
              className="transition-all duration-150 cursor-pointer hover:opacity-80 hover:stroke-[#6542C5] hover:stroke-1"
              onMouseEnter={(e) => onHover(e, d.dateKey)}
              onMouseLeave={onLeave}
              onClick={() => onClick(d.dateKey)}
            />
          );
        })}
      </svg>

      {/* Center Streak Counter with count-up animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <span className="font-space text-3xl font-bold text-[#6542C5] dark:text-[#B59AF7]">
            {data?.currentStreak ?? 0}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">
            Day Streak
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// GRID MATRIX VIEW (53 columns x 7 weekdays)
// ==========================================
function GridHeatmapView({
  days,
  data,
  onHover,
  onLeave,
  onClick,
}: {
  days: { dateKey: string; month: number; day: number; dayOfWeek: number }[];
  data: ActivityResponse | null;
  onHover: (e: React.MouseEvent, dateKey: string) => void;
  onLeave: () => void;
  onClick: (dateKey: string) => void;
}) {
  const weeks: { dateKey: string; month: number; day: number; dayOfWeek: number }[][] = [];
  let currentWeek: typeof days = [];

  days.forEach((d) => {
    currentWeek.push(d);
    if (d.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex gap-1 min-w-[700px] justify-center">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((d) => {
              const pts = data?.dailyData?.[d.dateKey]?.totalPoints || 0;
              let fill = '#E8E1D7';
              if (pts > 0) {
                if (pts <= 2) fill = '#DDD6FE';
                else if (pts <= 5) fill = '#C4B5FD';
                else if (pts <= 9) fill = '#8B5CF6';
                else if (pts <= 14) fill = '#6D28D9';
                else fill = '#4C1D95';
              }

              return (
                <div
                  key={d.dateKey}
                  className="h-3 w-3 rounded-xs cursor-pointer hover:ring-1 hover:ring-[#6542C5] transition-all"
                  style={{ backgroundColor: fill }}
                  onMouseEnter={(e) => onHover(e, d.dateKey)}
                  onMouseLeave={onLeave}
                  onClick={() => onClick(d.dateKey)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

