import { useRef, useState } from 'react';
import { Mail, Calendar, Target, Zap, Flame, BookOpen, Edit3, Check, Camera } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function Profile() {
  const { user, uploadAvatar } = useAuth();
  const { goal, progress } = useAppData();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    setEditing(false);
    showToast('Profile updated.');
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Image is too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(file);
      showToast('Profile photo updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not upload your photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Profile" subtitle="Your account and learning summary." />

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Profile card */}
          <Card padding="lg" className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar user={user} size={80} className="text-2xl shadow-soft" />
                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#6542C5] text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-60"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              {editing ? (
                <div className="mt-4 w-full max-w-xs">
                  <Input value={name} onChange={(e) => setName(e.target.value)} label="Name" />
                  <Button size="sm" className="mt-3" fullWidth onClick={save}>
                    <Check size={14} /> Save
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="mt-4 font-display text-xl font-bold text-ink-900 dark:text-ink-50">{user?.name}</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{user?.email}</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>
                    <Edit3 size={14} /> Edit profile
                  </Button>
                </>
              )}
            </div>
            <div className="mt-6 space-y-3 border-t border-ink-200 pt-4 dark:border-ink-800">
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={new Date(user?.createdAt ?? Date.now()).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <InfoRow icon={Target} label="Current goal" value={goal?.title ?? 'Not set'} />
              <InfoRow icon={Zap} label="Level" value={`${user?.level ?? 1} · ${user?.xp ?? 0} XP`} />
            </div>
          </Card>

          {/* Stats + activity */}
          <div className="space-y-5 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatBox icon={Flame} label="Streak" value={`${progress?.streakDays ?? 0} days`} color="warning" />
              <StatBox icon={BookOpen} label="Topics" value={`${progress?.topicsMastered ?? 0}`} color="success" />
              <StatBox icon={Zap} label="XP" value={`${user?.xp ?? 0}`} color="primary" />
              <StatBox icon={Target} label="Overall" value={`${progress?.overallCompletion ?? 0}%`} color="accent" />
            </div>

            <Card>
              <CardHeader title="Learning Goal" subtitle="Your current study target" />
              {goal ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-800">
                    <div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{goal.title}</p>
                      <p className="text-xs text-ink-400">{goal.subjects.join(', ')}</p>
                    </div>
                    <Badge tone="primary">{goal.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goal.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-400">No goal set yet.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent Activity" subtitle="Your latest study sessions" />
              <div className="space-y-2">
                {[
                  { label: 'Completed Dynamic Programming session', time: '2h ago', icon: BookOpen },
                  { label: 'Scored 78% on DSA quiz', time: 'Yesterday', icon: Zap },
                  { label: 'Reached 7-day streak', time: '2 days ago', icon: Flame },
                  { label: 'Completed Linked Lists session', time: '3 days ago', icon: BookOpen },
                ].map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-800"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-[#6542C5] dark:bg-primary-900/40">
                      <a.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{a.label}</p>
                      <p className="text-xs text-ink-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{value}</p>
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  color: 'primary' | 'warning' | 'accent' | 'success';
}) {
  const colors = {
    primary: 'bg-primary-50 text-[#6542C5] dark:bg-primary-900/40 dark:text-[#B59AF7]',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-700/20 dark:text-warning-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300',
    success: 'bg-success-50 text-success-600 dark:bg-success-700/20 dark:text-success-400',
  };
  return (
    <Card padding="sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </Card>
  );
}
