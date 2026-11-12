import { Link } from 'react-router-dom';
import { BookOpen, Layers, ArrowRight, Code, Database, HardDrive, Network } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ProgressBar } from '@/components/ui/ProgressRing';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import type { StudyPlan } from '@/types';

interface MyCoursesSectionProps {
  plan: StudyPlan | null;
}

export function MyCoursesSection({ plan }: MyCoursesSectionProps) {
  const defaultCourses = [
    {
      id: 'dsa',
      name: 'Data Structures & Algorithms',
      category: 'Core Computer Science',
      icon: Code,
      progress: plan?.completionPercent ?? 78,
      lessonsCompleted: 14,
      totalLessons: 18,
    },
    {
      id: 'os',
      name: 'Operating Systems',
      category: 'Systems & Architecture',
      icon: HardDrive,
      progress: 62,
      lessonsCompleted: 10,
      totalLessons: 16,
    },
    {
      id: 'dbms',
      name: 'Database Management Systems',
      category: 'Data Engineering',
      icon: Database,
      progress: 85,
      lessonsCompleted: 12,
      totalLessons: 14,
    },
    {
      id: 'cn',
      name: 'Computer Networks',
      category: 'Networking & Security',
      icon: Network,
      progress: 45,
      lessonsCompleted: 6,
      totalLessons: 14,
    },
  ];

  return (
    <Reveal variant="fade-up" delay={0.1}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-space text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={20} className="text-[#6542C5] dark:text-[#B59AF7]" />
              My Active Courses
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Current college subjects and learning tracks
            </p>
          </div>

          <Link
            to="/app/plan"
            className="text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] hover:underline flex items-center gap-1"
          >
            All Courses <ArrowRight size={13} />
          </Link>
        </div>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultCourses.map((course) => {
            const Icon = course.icon;

            return (
              <StaggerItem key={course.id}>
                <SpotlightCard className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] dark:bg-[#1D1922] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--surface-muted)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                        {course.lessonsCompleted}/{course.totalLessons} Lessons
                      </span>
                    </div>

                    <h4 className="font-space text-base font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                      {course.name}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-medium">
                      <Layers size={12} /> {course.category}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--text-muted)] font-medium">Progress</span>
                        <span className="font-bold text-[var(--text-primary)] font-space">
                          {course.progress}%
                        </span>
                      </div>
                      <ProgressBar value={course.progress} height={6} />
                    </div>

                    <Link to="/app/session" className="block">
                      <button className="w-full py-2 px-3 rounded-xl bg-[var(--surface-muted)]/60 hover:bg-[#F5F3FD] dark:hover:bg-[#B59AF7]/10 text-[var(--text-primary)] hover:text-[#6542C5] dark:hover:text-[#B59AF7] text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-[var(--border)] hover:border-[#6542C5]/30 dark:hover:border-[#B59AF7]/30">
                        <span>Continue Track</span>
                        <ArrowRight size={12} />
                      </button>
                    </Link>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </Reveal>
  );
}
