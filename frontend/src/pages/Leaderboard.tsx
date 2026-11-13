import { useState, useEffect } from 'react';
import { Trophy, Flame, Award, Users, Star, ArrowUpRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAppData } from '@/store/AppDataContext';
import { useAuth } from '@/store/AuthContext';
import { gamificationService } from '@/services/gamificationService';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  isUser: boolean;
}

export function Leaderboard() {
  const { user } = useAuth();
  const { achievements } = useAppData();
  const [tab, setTab] = useState<'weekly' | 'all-time'>('weekly');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationService
      .getLeaderboard()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(data);
        } else {
          // Fallback if brand new database
          setLeaders([
            {
              rank: 1,
              userId: user?.id || 'you',
              name: user?.name || 'You',
              xp: user?.xp || 100,
              streak: 1,
              level: user?.level || 1,
              isUser: true,
            },
          ]);
        }
      })
      .catch(() => {
        setLeaders([
          {
            rank: 1,
            userId: user?.id || 'you',
            name: user?.name || 'You',
            xp: user?.xp || 100,
            streak: 1,
            level: user?.level || 1,
            isUser: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Leaderboard & Badges"
          subtitle="Compete with peers, gain verified XP, and unlock milestones."
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={tab === 'weekly' ? 'primary' : 'outline'}
                onClick={() => setTab('weekly')}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={tab === 'all-time' ? 'primary' : 'outline'}
                onClick={() => setTab('all-time')}
              >
                All-Time
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6542C5] border-t-transparent dark:border-[#B59AF7]" />
            <p className="mt-3 text-xs text-[#8A8192]">Loading global scholar standings...</p>
          </div>
        ) : (
          <CardGrid cols={12}>
            {/* Top 3 Spotlight */}
            <div className="col-span-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaders.slice(0, 3).map((l) => (
                  <Card
                    key={l.rank}
                    padding="lg"
                    className={`text-center relative overflow-hidden ${
                      l.rank === 1 ? 'border-amber-400/50 bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="inline-flex size-10 rounded-full bg-[var(--surface-muted)] items-center justify-center font-space font-bold text-sm mb-2 text-[#6542C5] dark:text-[#B59AF7]">
                      #{l.rank}
                    </div>
                    <h3 className="font-space font-bold text-base text-[var(--text-primary)]">
                      {l.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">Level {l.level} Scholar</p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold">
                      <span className="text-[#6542C5] dark:text-[#B59AF7]">{l.xp} XP</span>
                      <span className="text-amber-500 flex items-center gap-1">
                        <Flame size={13} /> {l.streak}d
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Full Rank Table */}
            <div className="col-span-12 lg:col-span-8">
              <Card padding="lg">
                <CardHeader title="Rankings" subtitle="Live updates via verified activity events" />
                <div className="space-y-2 mt-2">
                  {leaders.map((l) => (
                    <div
                      key={l.rank}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        l.isUser
                          ? 'border-[#6542C5]/40 bg-[#F5F3FD]/80 dark:bg-[#B59AF7]/10'
                          : 'border-[var(--border)] bg-[var(--surface-muted)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-space font-bold text-sm w-6 text-center text-[var(--text-muted)]">
                          {l.rank}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            {l.name} {l.isUser && <Badge tone="primary">You</Badge>}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">Level {l.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-amber-500 flex items-center gap-1">
                          <Flame size={12} /> {l.streak}d
                        </span>
                        <span className="text-[var(--text-primary)] font-mono">{l.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Unlocked Badges */}
            <div className="col-span-12 lg:col-span-4">
              <Card padding="lg">
                <CardHeader title="Achievements" subtitle="Earn badges through consistency" />
                <div className="space-y-3 mt-2">
                  {achievements?.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)]"
                    >
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                          a.unlocked
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-ink-100 text-ink-400'
                        }`}
                      >
                        <Award size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {a.description}
                        </p>
                      </div>
                      {a.unlocked ? (
                        <Badge tone="success">Unlocked</Badge>
                      ) : (
                        <Badge tone="neutral">Locked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </CardGrid>
        )}
      </PageContainer>
    </AppLayout>
  );
}
