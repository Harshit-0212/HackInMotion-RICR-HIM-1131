import { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Upload,
  Play,
  Filter,
  Plus,
  Loader2,
  Trash2,
  Eye,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import {
  adminTaxonomyService,
  type TaxonomyField,
  type QuestionBankItem,
  type CoverageStat,
} from '@/services/adminTaxonomyService';

export function BulkQuestionStudio() {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'coverage' | 'generator' | 'review' | 'taxonomy' | 'import'>('coverage');

  // Taxonomy state
  const [taxonomy, setTaxonomy] = useState<TaxonomyField[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Coverage state
  const [coverage, setCoverage] = useState<CoverageStat[]>([]);
  const [loadingCoverage, setLoadingCoverage] = useState(true);

  // Generator form state
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [roleTarget, setRoleTarget] = useState('');
  const [count, setCount] = useState(10);
  const [difficultyMix, setDifficultyMix] = useState({ easy: 30, medium: 50, hard: 20 });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<any>(null);

  // Review Queue state
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [reviewFilterStatus, setReviewFilterStatus] = useState<string>('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Taxonomy Editor State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCategory, setNewFieldCategory] = useState<'Normal' | 'Special' | 'Interview Practice'>('Normal');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  // Licensed Import State
  const [importLicense, setImportLicense] = useState('CC-BY-4.0');
  const [importSource, setImportSource] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const loadTaxonomy = async () => {
    try {
      const data = await adminTaxonomyService.getTaxonomy();
      setTaxonomy(data);
      if (data.length > 0 && !selectedFieldId) {
        setSelectedFieldId(data[0].id);
        if (data[0].subjects.length > 0) {
          setSelectedSubjectId(data[0].subjects[0].id);
          if (data[0].subjects[0].topics.length > 0) {
            setSelectedTopicId(data[0].subjects[0].topics[0].id);
          }
        }
      }
    } catch {
      showToast('Could not load taxonomy.', 'error');
    } finally {
      setLoadingTaxonomy(false);
    }
  };

  const loadCoverage = async () => {
    setLoadingCoverage(true);
    try {
      const data = await adminTaxonomyService.getCoverage();
      setCoverage(data);
    } catch {
      showToast('Could not load coverage stats.', 'error');
    } finally {
      setLoadingCoverage(false);
    }
  };

  const loadReviewQueue = async () => {
    setLoadingQuestions(true);
    try {
      const data = await adminTaxonomyService.listQuestions({
        status: reviewFilterStatus || undefined,
        limit: 100,
      });
      setQuestions(data.questions);
    } catch {
      showToast('Could not load review queue.', 'error');
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadTaxonomy();
    loadCoverage();
  }, []);

  useEffect(() => {
    if (subTab === 'review') loadReviewQueue();
    if (subTab === 'coverage') loadCoverage();
  }, [subTab, reviewFilterStatus]);

  // Handle Poll for active generation job
  useEffect(() => {
    if (!activeJobId) return;
    const interval = setInterval(async () => {
      try {
        const job = await adminTaxonomyService.getJobStatus(activeJobId);
        setJobProgress(job);
        if (job.status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          showToast(`Generated ${job.generatedCount} questions successfully! Saved to Review Queue.`, 'success');
          loadCoverage();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          showToast(`Generation job failed: ${job.error || 'Unknown error'}`, 'error');
        }
      } catch {
        // Continue polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const currentField = taxonomy.find((f) => f.id === selectedFieldId);
  const currentSubject = currentField?.subjects.find((s) => s.id === selectedSubjectId);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentField || !currentSubject || !selectedTopicId) {
      showToast('Please select Field, Subject and Topic.', 'error');
      return;
    }

    const topicObj = currentSubject.topics.find((t) => t.id === selectedTopicId);

    setIsGenerating(true);
    try {
      const res = await adminTaxonomyService.startBulkGeneration({
        fieldId: currentField.id,
        fieldName: currentField.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        topicId: selectedTopicId,
        topicName: topicObj?.name || 'General',
        category: currentField.category,
        roleTarget: roleTarget.trim() || undefined,
        count,
        difficultyMix,
        questionTypes: selectedTypes,
      });
      setActiveJobId(res.batchId);
      showToast('Bulk background generation started.', 'info');
    } catch (err: unknown) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      showToast(msg, 'error');
    }
  };

  const handleQuickGapFill = (stat: CoverageStat) => {
    setSelectedFieldId(stat.fieldId);
    setSelectedSubjectId(stat.subjectId);
    setSelectedTopicId(stat.topicId);
    setCount(Math.min(20, Math.max(5, 20 - stat.published)));
    setSubTab('generator');
    showToast(`Loaded "${stat.topicName}" into generator with target gap count.`, 'info');
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminTaxonomyService.updateQuestionStatus(id, status);
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status: status as any } : q)));
      showToast(`Question status set to ${status}.`, 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const handlePublishBatch = async (batchId: string) => {
    try {
      const res = await adminTaxonomyService.publishBatch(batchId);
      showToast(`Batch published! ${res.publishedCount} questions made active.`, 'success');
      loadReviewQueue();
    } catch {
      showToast('Failed to publish batch.', 'error');
    }
  };

  const handleUndoBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to permanently delete this entire batch?')) return;
    try {
      const res = await adminTaxonomyService.undoBatch(batchId);
      showToast(`Batch undone. ${res.deletedCount} draft questions deleted.`, 'info');
      loadReviewQueue();
    } catch {
      showToast('Failed to undo batch.', 'error');
    }
  };

  const handleLicensedImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importLicense.toUpperCase().includes('NC') || importLicense.toUpperCase().includes('ND')) {
      showToast('Import rejected: Non-Commercial (NC) and No-Derivatives (ND) materials cannot be ingested.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of question objects.');

      setIsImporting(true);
      const res = await adminTaxonomyService.importLicensed({
        questions: parsed,
        license: importLicense,
        sourceName: importSource || 'Licensed Feed',
      });
      showToast(`Successfully imported ${res.importedCount} questions under license ${importLicense}.`, 'success');
      setImportJsonText('');
      setSubTab('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format.';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    try {
      const added = await adminTaxonomyService.addField(newFieldName.trim(), newFieldCategory);
      setTaxonomy((prev) => [...prev, added]);
      setNewFieldName('');
      showToast(`Field "${added.name}" created.`, 'success');
    } catch {
      showToast('Could not create field.', 'error');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldId || !newSubjectName.trim()) return;
    try {
      const added = await adminTaxonomyService.addSubject(selectedFieldId, newSubjectName.trim());
      setTaxonomy((prev) =>
        prev.map((f) => (f.id === selectedFieldId ? { ...f, subjects: [...f.subjects, added] } : f))
      );
      setNewSubjectName('');
      showToast(`Subject "${added.name}" added.`, 'success');
    } catch {
      showToast('Could not add subject.', 'error');
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldId || !selectedSubjectId || !newTopicName.trim()) return;
    try {
      const added = await adminTaxonomyService.addTopic(selectedFieldId, selectedSubjectId, newTopicName.trim());
      setTaxonomy((prev) =>
        prev.map((f) => {
          if (f.id !== selectedFieldId) return f;
          return {
            ...f,
            subjects: f.subjects.map((s) =>
              s.id === selectedSubjectId ? { ...s, topics: [...s.topics, added] } : s
            ),
          };
        })
      );
      setNewTopicName('');
      showToast(`Topic "${added.name}" added.`, 'success');
    } catch {
      showToast('Could not add topic.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#D8D0C5] dark:border-white/10 pb-3">
        <button
          onClick={() => setSubTab('coverage')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'coverage'
              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] dark:text-[#B8AFBE] dark:hover:bg-[#28222F]'
          }`}
        >
          Coverage Dashboard
        </button>

        <button
          onClick={() => setSubTab('generator')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'generator'
              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] dark:text-[#B8AFBE] dark:hover:bg-[#28222F]'
          }`}
        >
          Bulk Generator
        </button>

        <button
          onClick={() => setSubTab('review')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'review'
              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] dark:text-[#B8AFBE] dark:hover:bg-[#28222F]'
          }`}
        >
          Review & QC Queue
        </button>

        <button
          onClick={() => setSubTab('taxonomy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'taxonomy'
              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] dark:text-[#B8AFBE] dark:hover:bg-[#28222F]'
          }`}
        >
          Taxonomy Manager
        </button>

        <button
          onClick={() => setSubTab('import')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            subTab === 'import'
              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] dark:text-[#B8AFBE] dark:hover:bg-[#28222F]'
          }`}
        >
          Licensed Importer
        </button>
      </div>

      {/* 1. COVERAGE DASHBOARD */}
      {subTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#211D28] dark:text-[#F5F0E8]">
                Curriculum Topic Coverage & Gaps
              </h3>
              <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE]">
                Topics highlighted in amber have fewer than 20 published questions.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={loadCoverage}>
              <RotateCcw size={13} /> Refresh Coverage
            </Button>
          </div>

          {loadingCoverage ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6542C5]" />
            </div>
          ) : coverage.length === 0 ? (
            <div className="p-8 text-center bg-[#FBF8F2] dark:bg-[#1D1922] rounded-2xl border border-[#D8D0C5] dark:border-white/10">
              <p className="text-xs text-[#8A8192]">No questions generated yet. Switch to Bulk Generator to create questions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1EDE6] dark:bg-[#141217] text-[#5F5668] dark:text-[#B8AFBE] border-b border-[#D8D0C5] dark:border-white/10">
                  <tr>
                    <th className="p-3 font-semibold">Field / Subject</th>
                    <th className="p-3 font-semibold">Topic</th>
                    <th className="p-3 font-semibold">Published</th>
                    <th className="p-3 font-semibold">In Review / Draft</th>
                    <th className="p-3 font-semibold">Difficulty Split (E/M/H)</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D0C5]/50 dark:divide-white/5">
                  {coverage.map((c, i) => {
                    const isGap = c.published < 20;
                    return (
                      <tr
                        key={i}
                        className={
                          isGap
                            ? 'bg-amber-500/5 hover:bg-amber-500/10 transition-colors'
                            : 'hover:bg-[#E8E1D7]/30 dark:hover:bg-[#28222F]/40 transition-colors'
                        }
                      >
                        <td className="p-3 font-medium text-[#211D28] dark:text-[#F5F0E8]">
                          {c.fieldName} <span className="opacity-60">› {c.subjectName}</span>
                        </td>
                        <td className="p-3 font-bold text-[#6542C5] dark:text-[#B59AF7]">
                          {c.topicName}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                              isGap
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {c.published} / 20
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#5F5668] dark:text-[#B8AFBE]">
                          {c.needsReview + c.draft}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#5F5668] dark:text-[#B8AFBE]">
                          {c.easy}e / {c.medium}m / {c.hard}h
                        </td>
                        <td className="p-3 text-right">
                          {isGap && (
                            <Button size="sm" variant="primary" onClick={() => handleQuickGapFill(c)}>
                              <Sparkles size={12} /> Fill Gap ({20 - c.published})
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. BULK GENERATOR FORM */}
      {subTab === 'generator' && (
        <div className="max-w-2xl bg-[#FBF8F2] dark:bg-[#1D1922] p-6 rounded-3xl border border-[#D8D0C5] dark:border-white/10 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-base text-[#211D28] dark:text-[#F5F0E8]">
              Generate Rigorous Question Batches
            </h3>
            <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE]">
              Generates in chunks of 10 with automatic second-pass independent solver validation.
            </p>
          </div>

          <form onSubmit={handleStartGeneration} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Field
                </label>
                <select
                  value={selectedFieldId}
                  onChange={(e) => {
                    setSelectedFieldId(e.target.value);
                    const f = taxonomy.find((tx) => tx.id === e.target.value);
                    if (f && f.subjects.length > 0) {
                      setSelectedSubjectId(f.subjects[0].id);
                      if (f.subjects[0].topics.length > 0) {
                        setSelectedTopicId(f.subjects[0].topics[0].id);
                      }
                    }
                  }}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                >
                  {taxonomy.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const s = currentField?.subjects.find((sb) => sb.id === e.target.value);
                    if (s && s.topics.length > 0) {
                      setSelectedTopicId(s.topics[0].id);
                    }
                  }}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                >
                  {currentField?.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                >
                  {currentSubject?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                Role-Based Technical Target (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Java Developer, Frontend, DevOps, Data Analyst"
                value={roleTarget}
                onChange={(e) => setRoleTarget(e.target.value)}
                className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-3 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Count (Up to 50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-3 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Difficulty
                </label>
                <select
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'easy') setDifficultyMix({ easy: 80, medium: 20, hard: 0 });
                    if (v === 'medium') setDifficultyMix({ easy: 20, medium: 60, hard: 20 });
                    if (v === 'hard') setDifficultyMix({ easy: 10, medium: 20, hard: 70 });
                  }}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                >
                  <option value="medium">Balanced (20% Easy, 60% Med, 20% Hard)</option>
                  <option value="easy">Beginner Friendly (80% Easy, 20% Med)</option>
                  <option value="hard">Advanced (70% Hard, 20% Med, 10% Easy)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1.5">
                Question Formats
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'mcq', label: 'MCQ (Single Correct)' },
                  { id: 'true_false', label: 'True / False' },
                  { id: 'short_answer', label: 'Short Answer' },
                  { id: 'predict_output', label: 'Predict Output' },
                  { id: 'find_bug', label: 'Find Bug' },
                  { id: 'fill_blank', label: 'Fill in Blank' },
                  { id: 'coding', label: 'Coding' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedTypes((prev) =>
                        prev.includes(type.id) ? prev.filter((t) => t !== type.id) : [...prev, type.id]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedTypes.includes(type.id)
                        ? 'border-[#6542C5] bg-[#6542C5]/10 text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7]'
                        : 'border-[#D8D0C5] text-[#5F5668] dark:border-white/10 dark:text-[#B8AFBE]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {isGenerating && (
              <div className="p-3.5 rounded-2xl bg-[#6542C5]/10 border border-[#6542C5]/20 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#6542C5] dark:text-[#B59AF7]" />
                <div className="text-xs">
                  <p className="font-bold text-[#6542C5] dark:text-[#B59AF7]">
                    Generating Batch: {jobProgress?.generatedCount || 0} / {count} questions
                  </p>
                  <p className="text-[10px] text-[#8A8192]">Running 2-pass quality audit in background...</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={isGenerating}>
                <Sparkles size={14} /> Start Batch Generation
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. REVIEW QUEUE */}
      {subTab === 'review' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#211D28] dark:text-[#F5F0E8]">
                Quality Control Review Queue
              </h3>
              <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE]">
                Approve, reject, or audit questions. Items flagged by independent solver appear as "Needs Review".
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reviewFilterStatus}
                onChange={(e) => setReviewFilterStatus(e.target.value)}
                className="h-8 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="needs_review">Needs Review (Solver Flagged)</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button size="sm" variant="outline" onClick={loadReviewQueue}>
                <RotateCcw size={13} /> Refresh
              </Button>
            </div>
          </div>

          {loadingQuestions ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6542C5]" />
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center bg-[#FBF8F2] dark:bg-[#1D1922] rounded-2xl border border-[#D8D0C5] dark:border-white/10">
              <p className="text-xs text-[#8A8192]">No questions matching the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    q.status === 'needs_review'
                      ? 'border-amber-400 bg-amber-500/5 dark:border-amber-500/40'
                      : 'border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={q.difficulty === 'hard' ? 'error' : q.difficulty === 'easy' ? 'success' : 'primary'}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-xs font-semibold text-[#6542C5] dark:text-[#B59AF7]">
                        {q.topicName}
                      </span>
                      <span className="text-[10px] text-[#8A8192] uppercase font-mono">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'needs_review' && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle size={11} /> Solver Mismatch
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#8A8192]">
                        Status: <strong className="uppercase">{q.status}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#211D28] dark:text-[#F5F0E8] mb-2">{q.prompt}</p>

                  {q.codeSnippet && (
                    <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto mb-2">
                      {q.codeSnippet}
                    </pre>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg text-xs border ${
                            opt === q.correctAnswer
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                              : 'border-[#D8D0C5] dark:border-white/10 text-[#5F5668] dark:text-[#B8AFBE]'
                          }`}
                        >
                          {i + 1}. {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-[#5F5668] dark:text-[#B8AFBE] bg-[#F1EDE6] dark:bg-[#141217] p-2.5 rounded-xl my-2">
                    <strong className="text-[#211D28] dark:text-[#F5F0E8]">Explanation:</strong> {q.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D8D0C5]/40 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      {q.batchId && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handlePublishBatch(q.batchId!)}>
                            Publish Whole Batch
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleUndoBatch(q.batchId!)}>
                            Undo Batch
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="success" onClick={() => handleUpdateStatus(q.id, 'published')}>
                        Approve & Publish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(q.id, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAXONOMY MANAGER */}
      {subTab === 'taxonomy' && (
        <div className="space-y-6">
          <div className="bg-[#FBF8F2] dark:bg-[#1D1922] p-5 rounded-3xl border border-[#D8D0C5] dark:border-white/10 space-y-4">
            <h3 className="font-bold text-sm text-[#211D28] dark:text-[#F5F0E8]">Add New Field</h3>
            <form onSubmit={handleAddField} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Field name (e.g. Data Science, BioTech)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-3 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none flex-1 min-w-[200px]"
              />
              <select
                value={newFieldCategory}
                onChange={(e) => setNewFieldCategory(e.target.value as any)}
                className="h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-2.5 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Special">Special</option>
                <option value="Interview Practice">Interview Practice</option>
              </select>
              <Button type="submit" size="sm" variant="primary">
                <Plus size={14} /> Add Field
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxonomy.map((field) => (
              <div
                key={field.id}
                className="p-5 rounded-3xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#D8D0C5] dark:border-white/10">
                  <h4 className="font-bold text-sm text-[#211D28] dark:text-[#F5F0E8]">{field.name}</h4>
                  <Badge tone="primary">{field.category}</Badge>
                </div>

                <div className="space-y-2">
                  {field.subjects.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-[#F1EDE6]/60 dark:bg-[#141217] space-y-1">
                      <p className="text-xs font-bold text-[#6542C5] dark:text-[#B59AF7]">{sub.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {sub.topics.map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8E1D7] dark:bg-[#28222F] text-[#5F5668] dark:text-[#B8AFBE]"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LICENSED IMPORTER */}
      {subTab === 'import' && (
        <div className="max-w-2xl bg-[#FBF8F2] dark:bg-[#1D1922] p-6 rounded-3xl border border-[#D8D0C5] dark:border-white/10 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#211D28] dark:text-[#F5F0E8]">
              Licensed External Content Importer
            </h3>
            <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE]">
              Strictly blocks non-commercial (NC) or no-derivatives (ND) licenses to ensure compliance.
            </p>
          </div>

          <form onSubmit={handleLicensedImport} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  License Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MIT, CC-BY-4.0, Apache-2.0"
                  value={importLicense}
                  onChange={(e) => setImportLicense(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-3 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                  Source / Publisher Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenTech Question Bank"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] px-3 text-xs text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F5668] dark:text-[#B8AFBE] mb-1">
                JSON Questions Array
              </label>
              <textarea
                rows={8}
                required
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[{"prompt": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..."}]'
                className="w-full p-3 font-mono text-xs rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#F1EDE6] dark:bg-[#141217] text-[#211D28] dark:text-[#F5F0E8] focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" disabled={isImporting}>
              <Upload size={14} /> Ingest Licensed Questions
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

