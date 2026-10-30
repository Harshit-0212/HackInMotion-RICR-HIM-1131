import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import type { ProgressSnapshot } from '@/types';

interface LearningProgressSectionProps {
  progress: ProgressSnapshot | null;
}

export function LearningProgressSection({ progress }: LearningProgressSectionProps) {
  // Extract or fallback metrics
  const hours = progress?.hoursStudied ?? 18.5;
  const streak = progress?.streakDays ?? 5;
  const topicsMastered = progress?.topicsMastered ?? 12;
  const completion = progress?.overallCompletion ?? 78;

  // Chart dataset
  const rawChartData = progress?.weeklyActivity?.length
    ? progress.weeklyActivity
    : [
        { day: 'Mon', minutes: 45 },
        { day: 'Tue', minutes: 60 },
        { day: 'Wed', minutes: 30 },
        { day: 'Thu', minutes: 90 },
        { day: 'Fri', minutes: 75 },
        { day: 'Sat', minutes: 40 },
        { day: 'Sun', minutes: 85 },
      ];

  const chartData = rawChartData.map((item) => ({
    day: item.day,
    hours: parseFloat((item.minutes / 60).toFixed(1)),
    minutes: item.minutes,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
            Learning Activity & Progress
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Study duration trend over the past week
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
            🔥 {streak} Day Streak
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Clock size={13} className="text-blue-600 dark:text-blue-400" />
            <span>Study Time</span>
          </div>
          <p className="font-space text-xl font-bold text-slate-900 dark:text-white">
            {hours} <span className="text-xs font-normal text-slate-500">hrs</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Topics Mastered</span>
          </div>
          <p className="font-space text-xl font-bold text-slate-900 dark:text-white">
            {topicsMastered} <span className="text-xs font-normal text-slate-500">topics</span>
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Target size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>Overall Score</span>
          </div>
          <p className="font-space text-xl font-bold text-slate-900 dark:text-white">
            {completion}%
          </p>
        </div>
      </div>

      {/* Recharts Clean Area Chart */}
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-md text-xs font-sans">
                      <p className="font-bold text-slate-900 dark:text-white">{data.day}</p>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold">
                        {data.minutes} min ({data.hours} hrs)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#2563EB"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorHours)"
              activeDot={{ r: 6, fill: '#2563EB', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
