import { useState } from 'react';
import { FileText, Search, Sparkles, Brain, CheckSquare, UploadCloud, MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';

interface DocumentItem {
  id: string;
  name: string;
  subject: string;
  summary: string;
  keyPoints: string[];
  uploadedAt: string;
}

export function DocumentLibrary() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  const [docs] = useState<DocumentItem[]>([
    {
      id: 'doc1',
      name: 'Operating_Systems_Process_Synchronization.pdf',
      subject: 'Operating Systems',
      summary: 'Detailed overview of critical section problem, semaphores, mutexes, and classic IPC synchronization problems.',
      keyPoints: ['Dining Philosophers Solution', 'Peterson Algorithm', 'Priority Inversion'],
      uploadedAt: 'Nov 10, 2026',
    },
    {
      id: 'doc2',
      name: 'Graph_Algorithms_Cheatsheet.docx',
      subject: 'DSA',
      summary: 'Condensed notes covering Dijkstra, Bellman-Ford, Floyd-Warshall, and Topological Sorting.',
      keyPoints: ['Negative cycle detection', 'DAG relaxation', 'Disjoint Set Union'],
      uploadedAt: 'Nov 08, 2026',
    },
  ]);

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Document Library & Notes"
          subtitle="All lecture notes and study documents with instant AI synthesis."
          action={
            <Button size="sm" variant="primary" onClick={() => showToast('Upload dialog opened.', 'info')}>
              <UploadCloud size={14} /> Upload Notes
            </Button>
          }
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-ink-400 size-4" />
            <input
              type="text"
              placeholder="Search your library by document or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-ink-200 dark:border-ink-800 bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6542C5]/30"
            />
          </div>
        </div>

        <CardGrid cols={12}>
          {docs.map((doc) => (
            <div key={doc.id} className="col-span-12 md:col-span-6 flex">
              <Card padding="lg" className="w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="primary">{doc.subject}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{doc.uploadedAt}</span>
                  </div>

                  <h3 className="font-space font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <FileText size={16} className="text-[#6542C5] dark:text-[#B59AF7]" />
                    {doc.name}
                  </h3>

                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    {doc.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doc.keyPoints.map((pt) => (
                      <span key={pt} className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => showToast('Mock test generation triggered.', 'success')}>
                    <CheckSquare size={13} /> Gen Test
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showToast('Flashcards generated and added to deck.', 'success')}>
                    <Sparkles size={13} /> Make Cards
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => showToast('Grounded tutor chat session started.', 'info')}>
                    <MessageSquare size={13} /> Ask Tutor
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </CardGrid>
      </PageContainer>
    </AppLayout>
  );
}

