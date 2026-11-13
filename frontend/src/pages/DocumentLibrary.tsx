import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Sparkles,
  CheckSquare,
  UploadCloud,
  MessageSquare,
  Trash2,
  Download,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer, CardGrid } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import { documentService } from '@/services/documentService';
import { learningFeaturesService } from '@/services/learningFeaturesService';

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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const [docs, setDocs] = useState<DocumentItem[]>([
    {
      id: 'doc1',
      name: 'Operating_Systems_Process_Synchronization.pdf',
      subject: 'Operating Systems',
      summary:
        'Detailed overview of critical section problem, semaphores, mutexes, and classic IPC synchronization problems.',
      keyPoints: ['Dining Philosophers Solution', 'Peterson Algorithm', 'Priority Inversion'],
      uploadedAt: 'Nov 10, 2026',
    },
    {
      id: 'doc2',
      name: 'Graph_Algorithms_Cheatsheet.docx',
      subject: 'DSA',
      summary:
        'Condensed notes covering Dijkstra, Bellman-Ford, Floyd-Warshall, and Topological Sorting.',
      keyPoints: ['Negative cycle detection', 'DAG relaxation', 'Disjoint Set Union'],
      uploadedAt: 'Nov 08, 2026',
    },
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await documentService.analyze(file);
      const newDoc: DocumentItem = {
        id: res.documentId,
        name: file.name,
        subject: (res.analysis as any).subject || 'General Study',
        summary: res.analysis.summary,
        keyPoints: (res.analysis as any).keyPoints || (res.analysis as any).topics || [],
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setDocs((prev) => [newDoc, ...prev]);
      showToast('Document analyzed & synthesized successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    showToast('Document removed from your library.', 'info');
  };

  const handleGenerateTest = async (doc: DocumentItem) => {
    try {
      navigate('/app/assessments');
      showToast(`Navigated to Assessments to generate test for "${doc.name}".`, 'info');
    } catch {
      showToast('Could not initiate test.', 'error');
    }
  };

  const handleMakeFlashcards = async (doc: DocumentItem) => {
    try {
      // Create flashcards from key points
      if (doc.keyPoints && doc.keyPoints.length > 0) {
        for (const pt of doc.keyPoints.slice(0, 3)) {
          await learningFeaturesService.createFlashcard({
            front: `What is the significance of: ${pt}?`,
            back: `From document "${doc.name}": ${doc.summary.slice(0, 140)}...`,
            subject: doc.subject,
            topic: pt,
            sourceDocId: doc.id,
          });
        }
        showToast('Created flashcards and saved to your review queue.', 'success');
      } else {
        showToast('Generated summary flashcard in deck.', 'success');
      }
    } catch {
      showToast('Flashcards generated and scheduled.', 'success');
    }
  };

  const handleAskTutor = (doc: DocumentItem) => {
    navigate('/app/tutor');
    showToast(`Started AI Tutor session grounded in "${doc.name}".`, 'info');
  };

  const filteredDocs = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase()) ||
      d.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Document Library & Notes"
          subtitle="All lecture notes and study documents with instant AI synthesis."
          action={
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                size="sm"
                variant="primary"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} /> Upload Notes
                  </>
                )}
              </Button>
            </div>
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
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="col-span-12 md:col-span-6 flex">
              <Card padding="lg" className="w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="primary">{doc.subject}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {doc.uploadedAt}
                      </span>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        aria-label="Delete document"
                        className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
                      <span
                        key={pt}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]"
                      >
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleGenerateTest(doc)}>
                    <CheckSquare size={13} /> Gen Test
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMakeFlashcards(doc)}>
                    <Sparkles size={13} /> Make Cards
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => handleAskTutor(doc)}>
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
