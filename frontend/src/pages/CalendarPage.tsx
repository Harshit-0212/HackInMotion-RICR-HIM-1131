import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import { learningFeaturesService } from '@/services/learningFeaturesService';
import { activityService } from '@/services/activityService';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'session' | 'mocktest' | 'flashcard' | 'interview' | 'custom';
  time: string;
}

export function CalendarPage() {
  const { showToast } = useToast();
  const userTimezone = activityService.getUserTimezone();

  // Current year & month for view
  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Modal for new event
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(activityService.getUserLocalDate());
  const [newType, setNewType] = useState<'session' | 'mocktest' | 'flashcard' | 'interview' | 'custom'>('session');
  const [newTime, setNewTime] = useState('10:00 AM');

  // Drag-and-drop state for undo
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Data Structures - Trees & Graphs', date: new Date().toISOString().slice(0, 10), type: 'session', time: '10:00 AM' },
    { id: '2', title: 'Operating Systems Mock Quiz', date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), type: 'mocktest', time: '02:00 PM' },
    { id: '3', title: 'Daily Flashcards Deck', date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), type: 'flashcard', time: '06:00 PM' },
    { id: '4', title: 'System Design Interview Practice', date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), type: 'interview', time: '11:00 AM' },
  ]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const list = await learningFeaturesService.getCalendarEvents();
        if (list && list.length > 0) {
          const mapped: CalendarEvent[] = list.map((ev) => ({
            id: ev._id,
            title: ev.title,
            date: ev.date,
            type: (ev.type === 'mock-test' ? 'mocktest' : ev.type) as any,
            time: '10:00 AM',
          }));
          setEvents((prev) => {
            const ids = new Set(mapped.map((m) => m.id));
            return [...mapped, ...prev.filter((p) => !ids.has(p.id))];
          });
        }
      } catch {
        // Keeps state
      }
    }
    loadEvents();
  }, []);

  // Real calendar math for current view
  const { monthLabel, calendarDays } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: userTimezone,
    });
    const label = formatter.format(viewDate);

    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // First day weekday (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayWeekday = new Date(year, month, 1).getDay();
    // Normalize to Mon = 0 ... Sun = 6
    const startOffset = (firstDayWeekday + 6) % 7;

    // Previous month filler days
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    const days: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        day: d,
        dateKey: prevDate.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const mm = (month + 1).toString().padStart(2, '0');
      const dd = d.toString().padStart(2, '0');
      days.push({
        day: d,
        dateKey: `${year}-${mm}-${dd}`,
        isCurrentMonth: true,
      });
    }

    // Next month filler to round to complete 35 or 42 grid cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(year, month + 1, d);
        days.push({
          day: d,
          dateKey: nextDate.toISOString().slice(0, 10),
          isCurrentMonth: false,
        });
      }
    }

    return { monthLabel: label, calendarDays: days };
  }, [viewDate, userTimezone]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDragStart = (e: React.DragEvent, eventItem: CalendarEvent) => {
    setDraggedEvent(eventItem);
    e.dataTransfer.setData('text/plain', eventItem.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetDateKey: string) => {
    if (!draggedEvent) return;
    const previousDate = draggedEvent.date;
    const eventId = draggedEvent.id;

    if (previousDate === targetDateKey) return;

    // Update state
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: targetDateKey } : ev))
    );

    showToast(`"${draggedEvent.title}" rescheduled to ${targetDateKey}.`, 'info');

    setDraggedEvent(null);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter an event title', 'error');
      return;
    }

    const created: CalendarEvent = {
      id: `ev_${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      type: newType,
      time: newTime || '10:00 AM',
    };

    setEvents((prev) => [created, ...prev]);
    setIsAddOpen(false);
    setNewTitle('');
    showToast(`Milestone scheduled for ${newDate}`, 'success');

    // Also persist via activity service if applicable
    activityService
      .recordActivity('session', 1, { title: created.title, scheduledDate: newDate })
      .catch(() => {});
  };

  const todayStr = activityService.getUserLocalDate();

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Study Calendar"
          subtitle="Plan sessions, track mock tests, and drag-and-drop to reschedule."
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrevMonth} aria-label="Previous month">
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs font-bold px-2 text-[var(--text-primary)] min-w-[120px] text-center">
                {monthLabel}
              </span>
              <Button size="sm" variant="outline" onClick={handleNextMonth} aria-label="Next month">
                <ChevronRight size={14} />
              </Button>
              <Button size="sm" variant="primary" onClick={() => setIsAddOpen(true)}>
                <Plus size={14} /> Add Target
              </Button>
            </div>
          }
        />

        <CardGrid cols={12}>
          {/* Calendar Grid Built with Tailwind */}
          <div className="col-span-12 lg:col-span-8">
            <Card padding="lg">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-muted)] pb-3 border-b border-[var(--border)]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 mt-3">
                {calendarDays.map(({ day, dateKey, isCurrentMonth }) => {
                  const isToday = dateKey === todayStr;
                  const dayEvents = events.filter((e) => e.date === dateKey);

                  return (
                    <div
                      key={dateKey}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dateKey)}
                      className={`min-h-24 p-2 rounded-xl border transition-colors flex flex-col justify-between ${
                        !isCurrentMonth ? 'opacity-40 bg-[var(--surface-muted)]/20' : 'bg-[var(--surface)]'
                      } ${
                        isToday
                          ? 'border-[#6542C5] bg-[#F5F3FD]/40 dark:bg-[#B59AF7]/10'
                          : 'border-[var(--border)] hover:border-[#6542C5]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'text-[#6542C5] dark:text-[#B59AF7]'
                              : isCurrentMonth
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold text-[#6542C5] dark:text-[#B59AF7]">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                            className="p-1 rounded text-[10px] font-medium bg-[#6542C5]/10 text-[#6542C5] dark:text-[#B59AF7] truncate cursor-grab active:cursor-grabbing border border-[#6542C5]/20"
                            title={`${ev.title} (${ev.time}) - Drag to reschedule`}
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
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                    No scheduled events. Click "Add Target" to schedule.
                  </p>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge tone="primary">{ev.type}</Badge>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{ev.time}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{ev.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <Clock size={11} /> {ev.date}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </CardGrid>

        {/* Modal: Add Event */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Add Study Milestone</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graph Algorithms or Quiz 2"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Activity Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="session">Study Session</option>
                    <option value="mocktest">Mock Test</option>
                    <option value="flashcard">Flashcards</option>
                    <option value="interview">Interview Practice</option>
                    <option value="custom">General Reminder</option>
                  </select>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" variant="primary">
                    Save Milestone
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
