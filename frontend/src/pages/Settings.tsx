import { useState } from 'react';
import { Moon, Sun, Bell, Clock, Target, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AISettingsCard } from '@/components/settings/AISettingsCard';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [dailyTarget, setDailyTarget] = useState(120);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = () => {
    showToast('Account deletion is disabled in the demo.');
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Settings" subtitle="Manage your preferences and account." />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Appearance */}
          <Card padding="lg">
            <CardHeader title="Appearance" subtitle="Customize how Cadence looks" />
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-xl border border-ink-200 p-4 transition hover:border-ink-300 dark:border-ink-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-[#6542C5] dark:bg-primary-900/40">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Theme</p>
                  <p className="text-xs text-ink-400 capitalize">{theme} mode</p>
                </div>
              </div>
              <Badge tone="primary">{theme}</Badge>
            </button>
          </Card>

          {/* Notifications */}
          <Card padding="lg">
            <CardHeader title="Notifications" subtitle="Stay on top of your schedule" />
            <div className="space-y-3">
              <ToggleRow
                icon={Bell}
                label="Study reminders"
                description="Daily push to keep your streak"
                checked={notifications}
                onChange={setNotifications}
              />
              <div className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/40">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Reminder time</p>
                    <p className="text-xs text-ink-400">When to nudge you</p>
                  </div>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                />
              </div>
            </div>
          </Card>

          {/* Study preferences */}
          <Card padding="lg">
            <CardHeader title="Study Preferences" subtitle="Tune your daily target" />
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200">Daily study target</label>
                  <Badge tone="primary">
                    {Math.floor(dailyTarget / 60)}h {dailyTarget % 60}m
                  </Badge>
                </div>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={15}
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <div className="mt-1 flex justify-between text-xs text-ink-400">
                  <span>30 min</span>
                  <span>5 hours</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-[#6542C5] dark:bg-primary-900/40">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Preferred study time</p>
                    <p className="text-xs text-ink-400 capitalize">{user?.preferredStudyTime ?? 'evening'}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-300" />
              </div>
            </div>
          </Card>

          {/* AI Settings / Connect Gemini */}
          <AISettingsCard />

          {/* Account */}
          <Card padding="lg">
            <CardHeader title="Account" subtitle="Manage your account" />
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Email</p>
                  <p className="text-xs text-ink-400">{user?.email}</p>
                </div>
                <Badge tone="neutral">Verified</Badge>
              </div>
              <Button variant="outline" fullWidth onClick={handleLogout}>
                <LogOut size={16} /> Sign out
              </Button>
              <Button variant="danger" fullWidth onClick={handleDelete}>
                <Trash2 size={16} /> Delete account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-700">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-[#6542C5] dark:bg-primary-900/40">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{label}</p>
          <p className="text-xs text-ink-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#6542C5]' : 'bg-ink-200 dark:bg-ink-700'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}
