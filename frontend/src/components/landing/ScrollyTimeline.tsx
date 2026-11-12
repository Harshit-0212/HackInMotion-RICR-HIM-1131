import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';

interface Stage {
  num: string;
  label: string;
}

interface ScrollyTimelineProps {
  scrollYProgress: MotionValue<number>;
  stages: Stage[];
  onStageClick: (index: number) => void;
}

export function ScrollyTimeline({ scrollYProgress, stages, onStageClick }: ScrollyTimelineProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Height of the filled timeline path
  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const baseBorderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)';
  const activeBorderColor = isDark ? 'rgba(181,154,247,1)' : 'rgba(101,66,197,1)';

  return (
    <div className="absolute left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center lg:flex pl-4 pointer-events-auto">
      {/* Vertical Line Container */}
      <div className={`relative h-[320px] w-[3px] rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200/80'}`}>
        {/* Progress Fill Line */}
        <motion.div
          className="absolute top-0 w-full rounded-none bg-gradient-to-b from-[#6542C5] via-[#9B72F5] to-[#F2B38C]"
          style={{ height }}
        />

        {/* Stage Interactive Nodes */}
        <div className="absolute top-0 left-1/2 flex h-full -translate-x-1/2 flex-col justify-between py-1">
          {stages.map((stage, index) => {
            // Define active range for styling node scale
            const targetPos = index * 0.25;
            const minRange = targetPos - 0.125;
            const maxRange = targetPos + 0.125;

            // Map scroll progress to node scale
            const scale = useTransform(
              scrollYProgress,
              [
                Math.max(0, minRange - 0.05),
                Math.max(0, minRange),
                targetPos,
                Math.min(1, maxRange),
                Math.min(1, maxRange + 0.05),
              ],
              [1, 1.2, 1.45, 1.2, 1],
            );

            // Completed or current nodes stay bright, future nodes stay dim
            const fillOpacity = useTransform(scrollYProgress, [Math.max(0, targetPos - 0.05), targetPos], [0.15, 1]);

            // Change border color on active stage
            const borderStyle = useTransform(
              scrollYProgress,
              [Math.max(0, minRange), targetPos, Math.min(1, maxRange)],
              [baseBorderColor, activeBorderColor, baseBorderColor],
            );

            return (
              <button
                key={stage.num}
                onClick={() => onStageClick(index)}
                className="group relative flex items-center justify-center outline-none focus:outline-none"
              >
                {/* Node circle */}
                <motion.div
                  style={{ scale, borderColor: borderStyle }}
                  className={`h-4.5 w-4.5 rounded-sm border-2 transition-shadow duration-300 ${
                    isDark
                      ? 'bg-[#141217] group-hover:border-[#B59AF7] group-hover:shadow-[0_0_12px_rgba(181,154,247,0.6)]'
                      : 'bg-white group-hover:border-[#6542C5] group-hover:shadow-[0_0_12px_rgba(101,66,197,0.3)]'
                  }`}
                >
                  {/* Innermost filled glow */}
                  <motion.div
                    className={`rounded-none bg-gradient-to-br from-[#6542C5] via-[#9B72F5] to-[#F2B38C]`}
                    style={{ opacity: fillOpacity }}
                  />
                </motion.div>

                {/* Stage tooltip revealed on hover */}
                <div className="absolute left-8 flex origin-left translate-x-2 items-center opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none">
                  <div
                    className={`rounded-none border px-3 py-1.5 backdrop-blur-md shadow-lift whitespace-nowrap ${
                      isDark
                        ? 'border-white/10 bg-[#1D1922]/90 text-white'
                        : 'border-[#D8D0C5] bg-[#FBF8F2]/95 text-[#211D28]'
                    }`}
                  >
                    <span className={`text-xs font-bold mr-2 ${isDark ? 'text-[#B59AF7]' : 'text-[#6542C5]'}`}>
                      {stage.num}
                    </span>
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
