import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import { learningFeaturesService } from '@/services/learningFeaturesService';

interface EventItem {
  id: string;
  title: string;
  date: string;
  type: 'session' | 'mocktest' | 'flashcard' | 'interview';
  time: string;
}

export function CalendarPage() {
  const { showToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState('November 2026');

  const [events, setEvents] = useState<EventItem[]>([
    { id: '1', title: 'Data Structures - Trees & Graphs', date: '2026-11-12', type: 'session', time: '10:00 AM' },
    { id: '2', title: 'Operating Systems Mock Quiz', date: '2026-11-14', type: 'mocktest', time: '02:00 PM' },
    { id: '3', title: 'Daily Flashcards Deck', date: '2026-11-15', type: 'flashcard', time: '06:00 PM' },
    { id: '4', title: 'System Design Interview Practice', date: '2026-11-18', type: 'interview', time: '11:00 AM' },
  ]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const list = await learningFeaturesService.getCalendarEvents();
        if (list && list.length > 0) {
          setEvents(
            list.map((ev) => ({
              id: ev._id,
              title: ev.title,
              date: ev.date,
              type: (ev.type === 'mock-test' ? 'mocktest' : ev.type) as any,
              time: '10:00 AM',
            }))
          );
        }
      } catch {
        // Keeps defaults
      }
    }
    loadEvents();
  }, []);

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (day: number) => {
    showToast(`Session rescheduled to Nov ${day}. Undo available.`, {
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => showToast('Reschedule reverted.', 'success'),
      },
    });
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Study Calendar"
          subtitle="Plan sessions, track mock tests, and drag-and-drop to reschedule."
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => showToast('Previous month', 'info')}>
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs font-bold px-2 text-[var(--text-primary)]">{currentMonth}</span>
              <Button size="sm" variant="outline" onClick={() => showToast('Next month', 'info')}>
                <ChevronRight size={14} />
              </Button>
            </div>
          }
        />

        <CardGrid cols={12}>
          {/* Calendar Grid Built with Pure Tailwind */}
          <div className="col-span-12 lg:col-span-8">
            <Card padding="lg">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-muted)] pb-3 border-b border-[var(--border)]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 mt-3">
                {days.map((day) => {
                  const isToday = day === 12;
                  const dayEvents = events.filter((e) => e.date.endsWith(day.toString().padStart(2, '0')));
                  return (
                    <div
                      key={day}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day)}
                      className={`min-h-24 p-2 rounded-xl border transition-colors flex flex-col justify-between ${
                        isToday
                          ? 'border-[#6542C5] bg-[#F5F3FD]/40 dark:bg-[#B59AF7]/10'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[#6542C5]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isToday ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[var(--text-primary)]'}`}>
                          {day}
                        </span>
                        {isToday && <span className="text-[9px] font-bold text-[#6542C5] dark:text-[#B59AF7]">Today</span>}
                      </div>

                      <div className="space-y-1 my-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            draggable
                            className="p-1 rounded text-[10px] font-medium bg-[#6542C5]/10 text-[#6542C5] dark:text-[#B59AF7] truncate cursor-grab active:cursor-grabbing border border-[#6542C5]/20"
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>

                      <div className="h-1" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Upcoming Schedule Agenda */}
          <div className="col-span-12 lg:col-span-4">
            <Card padding="lg" className="space-y-4">
              <CardHeader title="Agenda" subtitle="Scheduled learning milestones" />
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge tone="primary">{ev.type}</Badge>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{ev.time}</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{ev.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={11} /> {ev.date}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </CardGrid>
      </PageContainer>
    </AppLayout>
  );
}

