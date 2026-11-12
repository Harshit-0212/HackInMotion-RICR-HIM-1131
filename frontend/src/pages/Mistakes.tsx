import { useState, useEffect } from 'react';
import { BookX, CheckCircle, Search, RefreshCw, Sparkles, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/store/ToastContext';
import { learningFeaturesService, type MistakeRecord } from '@/services/learningFeaturesService';

interface MistakeItem {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  subject: string;
  topic: string;
  explanation: string;
  resolved: boolean;
}

export function Mistakes() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<MistakeItem[]>([
    {
      id: 'm1',
      question: 'What is the worst-case time complexity of QuickSort?',
      userAnswer: 'O(N log N)',
      correctAnswer: 'O(N²)',
      subject: 'Data Structures & Algorithms',
      topic: 'Sorting Algorithms',
      explanation: 'QuickSort degrades to O(N²) when the selected pivot is consistently the minimum or maximum element.',
      resolved: false,
    },
    {
      id: 'm2',
      question: 'In Operating Systems, what problem does the Banker algorithm solve?',
      userAnswer: 'Process scheduling starvation',
      correctAnswer: 'Deadlock avoidance',
      subject: 'Operating Systems',
      topic: 'Deadlock Handling',
      explanation: 'The Banker algorithm tests for safety by simulating allocation before granting resource requests.',
      resolved: false,
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const fetched = await learningFeaturesService.getMistakes();
        if (fetched && fetched.length > 0) {
          setItems(
            fetched.map((m) => ({
              id: m._id,
              question: m.question,
              userAnswer: m.userAnswer,
              correctAnswer: m.correctAnswer,
              subject: m.subject,
              topic: m.topic,
              explanation: m.explanation,
              resolved: m.resolved,
            }))
          );
        }
      } catch {
        // Keeps fallback items
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await learningFeaturesService.resolveMistake(id);
    } catch {
      // offline fallback
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, resolved: true } : item)));
    showToast('Marked mistake as resolved! +15 XP earned.', 'success');
  };

  const filtered = items.filter((item) => {
    if (filter === 'unresolved' && item.resolved) return false;
    if (search && !item.question.toLowerCase().includes(search.toLowerCase()) && !item.topic.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Mistake Notebook"
          subtitle="Review incorrect answers across quizzes and drills to master weak spots."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'unresolved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('unresolved')}
              >
                Unresolved ({items.filter((i) => !i.resolved).length})
              </Button>
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({items.length})
              </Button>
            </div>
          }
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-ink-400 size-4" />
            <input
              type="text"
              placeholder="Search mistakes by question or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-ink-200 dark:border-ink-800 bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6542C5]/30"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All clear!"
            description="You have no unresolved mistakes matching your filters."
          />
        ) : (
          <CardGrid cols={12}>
            {filtered.map((item) => (
              <div key={item.id} className="col-span-12 md:col-span-6 flex">
                <Card padding="lg" className="w-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge tone="primary">{item.subject}</Badge>
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">{item.topic}</span>
                      </div>
                      {item.resolved ? (
                        <Badge tone="success">Resolved</Badge>
                      ) : (
                        <Badge tone="warning">Needs Review</Badge>
                      )}
                    </div>
                    <h3 className="font-space font-bold text-sm text-[var(--text-primary)] mt-1">
                      {item.question}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <p className="text-rose-600 dark:text-rose-400">
                        <span className="font-semibold">Your Answer:</span> {item.userAnswer}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Correct Answer:</span> {item.correctAnswer}
                      </p>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-[var(--surface-muted)] text-xs text-[var(--text-secondary)] border border-[var(--border)]">
                      <span className="font-bold flex items-center gap-1 mb-0.5 text-[#6542C5] dark:text-[#B59AF7]">
                        <Sparkles size={12} /> Key Concept Explanation
                      </span>
                      {item.explanation}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
                    {!item.resolved ? (
                      <Button size="sm" variant="primary" onClick={() => handleResolve(item.id)}>
                        <CheckCircle size={14} /> Mark Resolved
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </CardGrid>
        )}
      </PageContainer>
    </AppLayout>
  );
}

