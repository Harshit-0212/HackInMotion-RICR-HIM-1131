import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Layers, ArrowRight, Code, Database, HardDrive, Network } from 'lucide-react';
import type { StudyPlan } from '@/types';

interface MyCoursesSectionProps {
  plan: StudyPlan | null;
}

export function MyCoursesSection({ plan }: MyCoursesSectionProps) {
  // Course cards structured for college CS curriculum
  const defaultCourses = [
    {
      id: 'dsa',
      name: 'Data Structures & Algorithms',
      category: 'Core Computer Science',
      icon: Code,
      progress: plan?.completionPercent ?? 78,
      lessonsCompleted: 14,
      totalLessons: 18,
      color: 'blue',
    },
    {
      id: 'os',
      name: 'Operating Systems',
      category: 'Systems & Architecture',
      icon: HardDrive,
      progress: 62,
      lessonsCompleted: 10,
      totalLessons: 16,
      color: 'indigo',
    },
    {
      id: 'dbms',
      name: 'Database Management Systems',
      category: 'Data Engineering',
      icon: Database,
      progress: 85,
      lessonsCompleted: 12,
      totalLessons: 14,
      color: 'emerald',
    },
    {
      id: 'cn',
      name: 'Computer Networks',
      category: 'Networking & Security',
      icon: Network,
      progress: 45,
      lessonsCompleted: 6,
      totalLessons: 14,
      color: 'amber',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-space text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            My Active Courses
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current college subjects and learning tracks
          </p>
        </div>

        <Link
          to="/app/plan"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          All Courses <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultCourses.map((course) => {
          const Icon = course.icon;

          return (
            <motion.div
              key={course.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {course.lessonsCompleted}/{course.totalLessons} Lessons
                  </span>
                </div>

                <h4 className="font-space text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {course.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <Layers size={12} /> {course.category}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Progress</span>
                    <span className="font-bold text-slate-900 dark:text-white font-space">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <Link to="/app/session" className="block">
                  <button className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-bold transition-colors flex items-center justify-center gap-1">
                    <span>Continue Track</span>
                    <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
