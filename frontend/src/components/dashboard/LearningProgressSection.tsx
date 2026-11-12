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
import { Reveal } from '@/components/ui/Reveal';
import type { ProgressSnapshot } from '@/types';

interface LearningProgressSectionProps {
  progress: ProgressSnapshot | null;
}

const metricVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
};

export function LearningProgressSection({ progress }: LearningProgressSectionProps) {
  const hours = progress?.hoursStudied ?? 18.5;
  const streak = progress?.streakDays ?? 5;
  const topicsMastered = progress?.topicsMastered ?? 12;
  const completion = progress?.overallCompletion ?? 78;

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

  const metrics = [
    { icon: Clock, label: 'Study Time', value: hours, suffix: 'hrs', iconClass: 'text-[#6542C5] dark:text-[#B59AF7]' },
    { icon: CheckCircle2, label: 'Topics Mastered', value: topicsMastered, suffix: 'topics', iconClass: 'text-emerald-600 dark:text-emerald-400' },
    { icon: Target, label: 'Overall Score', value: completion, suffix: '%', iconClass: 'text-[#6542C5] dark:text-[#B59AF7]' },
  ];

  return (
    <Reveal variant="fade-up" delay={0.15}>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] dark:bg-[#1D1922] p-6 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="font-space text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#6542C5] dark:text-[#B59AF7]" />
              Learning Activity & Progress
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Study duration trend over the past week
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F3FD] text-[#6542C5] dark:bg-[#B59AF7]/10 dark:text-[#B59AF7] border border-[#6542C5]/20 dark:border-[#B59AF7]/30">
              🔥 {streak} Day Streak
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={metricVariants}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className={`p-3.5 rounded-2xl bg-[var(--surface-muted)]/60 border border-[var(--border)] hover:border-[#6542C5]/20 dark:hover:border-[#B59AF7]/20 transition-colors ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                  <Icon size={13} className={metric.iconClass} />
                  <span>{metric.label}</span>
                </div>
                <p className="font-space text-xl font-bold text-[var(--text-primary)]">
                  {metric.value} <span className="text-xs font-normal text-[var(--text-muted)]">{metric.suffix}</span>
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Recharts Clean Area Chart with Iris colors */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHoursIris" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6542C5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6542C5" stopOpacity={0.0} />
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
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-2.5 shadow-md text-xs font-sans">
                        <p className="font-bold text-[var(--text-primary)]">{data.day}</p>
                        <p className="text-[#6542C5] dark:text-[#B59AF7] font-semibold">
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
                stroke="#6542C5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorHoursIris)"
                activeDot={{ r: 6, fill: '#6542C5', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Reveal>
  );
}
