import { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  HardDrive,
  Edit,
  Trash2,
  Eye,
  Send,
  Archive,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Terminal,
  FileText,
  HelpCircle,
  X,
  Check,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { codingService } from '@/services/codingService';
import type {
  StoredCodingProblem,
  StoredCodingTestCase,
  StoredCodingProblemPrivate,
  CreateCodingProblemInput,
  GenerateDraftInput,
  ProblemStatus,
  ProblemDifficulty,
} from '@/types/coding';
import { useToast } from '@/store/ToastContext';

export function AdminCodingStudio() {
  const { showToast } = useToast();

  const [problems, setProblems] = useState<StoredCodingProblem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ProblemStatus | ''>('');
  const [difficultyFilter, setDifficultyFilter] = useState<ProblemDifficulty | ''>('');
  const [searchTopic, setSearchTopic] = useState('');

  // Selected Problem for Inspect/Edit/Review
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    problem: StoredCodingProblem;
    testCases: StoredCodingTestCase[];
    privateContent: StoredCodingProblemPrivate | null;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isAddTestCaseOpen, setIsAddTestCaseOpen] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateCodingProblemInput>({
    title: '',
    difficulty: 'easy',
    topic: '',
    tags: [],
    statement: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
  });
  const [tagsInput, setTagsInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // AI Draft Form State
  const [aiForm, setAiForm] = useState<GenerateDraftInput>({
    topic: 'Arrays',
    difficulty: 'easy',
    subtopic: '',
    targetAudience: 'Beginner competitive programmers',
    additionalConstraints: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Review Form State
  const [reviewMethod, setReviewMethod] = useState('Manual verification by instructor');
  const [reviewNotes, setReviewNotes] = useState('All test cases and edge cases verified.');
  const [isReviewing, setIsReviewing] = useState(false);

  // Add Test Case Form State
  const [tcVisibility, setTcVisibility] = useState<'sample' | 'hidden'>('sample');
  const [tcInput, setTcInput] = useState('');
  const [tcExpectedOutput, setTcExpectedOutput] = useState('');
  const [tcExplanation, setTcExplanation] = useState('');
  const [isAddingTc, setIsAddingTc] = useState(false);

  // Load problem list
  const loadProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await codingService.listAdminProblems({
        status: statusFilter || undefined,
        difficulty: difficultyFilter || undefined,
        topic: searchTopic.trim() || undefined,
        limit: 50,
      });
      setProblems(res.problems || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch admin problems.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, difficultyFilter, searchTopic]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Load full detail of selected problem
  const loadProblemDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await codingService.getAdminProblem(id);
      setSelectedDetail(data);
      setSelectedProblemId(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load problem detail.';
      showToast(msg, 'error');
    } finally {
      setDetailLoading(false);
    }
  }, [showToast]);

  // Handle Manual Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.topic.trim()) {
      showToast('Title and topic are required.', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await codingService.createProblem({
        ...createForm,
        tags,
      });

      showToast(`Created draft: ${created.title}`, 'success');
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        difficulty: 'easy',
        topic: '',
        tags: [],
        statement: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
      });
      setTagsInput('');
      loadProblems();
      loadProblemDetail(created._id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed.';
      showToast(msg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle AI Draft Generation
  const handleAiDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiForm.topic.trim()) {
      showToast('Topic is required.', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await codingService.generateDraft(aiForm);
      showToast(`AI draft generated: ${result.problem.title}`, 'success');
      setIsAiDraftOpen(false);
      loadProblems();
      setSelectedDetail(result);
      setSelectedProblemId(result.problem._id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI generation failed.';
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Add Test Case
  const handleAddTestCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId) return;
    if (!tcInput.trim() || !tcExpectedOutput.trim()) {
      showToast('Input and expected output are required.', 'error');
      return;
    }
    setIsAddingTc(true);
    try {
      await codingService.addTestCase(selectedProblemId, {
        visibility: tcVisibility,
        input: tcInput,
        expectedOutput: tcExpectedOutput,
        explanation: tcExplanation.trim() || undefined,
      });
      showToast('Test case added.', 'success');
      setIsAddTestCaseOpen(false);
      setTcInput('');
      setTcExpectedOutput('');
      setTcExplanation('');
      loadProblemDetail(selectedProblemId);
      loadProblems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add testcase.';
      showToast(msg, 'error');
    } finally {
      setIsAddingTc(false);
    }
  };

  // Handle Delete Test Case
  const handleDeleteTestCase = async (caseId: string) => {
    if (!selectedProblemId) return;
    if (!window.confirm('Delete this test case?')) return;
    try {
      await codingService.deleteTestCase(selectedProblemId, caseId);
      showToast('Test case removed.', 'info');
      loadProblemDetail(selectedProblemId);
      loadProblems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete testcase.';
      showToast(msg, 'error');
    }
  };

  // Handle Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId) return;
    setIsReviewing(true);
    try {
      const res = await codingService.reviewProblem(selectedProblemId, {
        verificationMethod: reviewMethod,
        notes: reviewNotes,
      });
      showToast('Problem marked as reviewed.', 'success');
      setIsReviewOpen(false);
      loadProblemDetail(selectedProblemId);
      loadProblems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review failed.';
      showToast(msg, 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    if (!selectedProblemId) return;
    if (!window.confirm('Publish this problem to students? It must be reviewed and meet all requirements.')) return;
    try {
      await codingService.publishProblem(selectedProblemId);
      showToast('Problem published successfully!', 'success');
      loadProblemDetail(selectedProblemId);
      loadProblems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publication failed.';
      showToast(msg, 'error');
    }
  };

  // Handle Archive
  const handleArchive = async () => {
    if (!selectedProblemId) return;
    if (!window.confirm('Archive this problem? It will no longer be visible to students.')) return;
    try {
      await codingService.archiveProblem(selectedProblemId);
      showToast('Problem archived.', 'info');
      loadProblemDetail(selectedProblemId);
      loadProblems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archive failed.';
      showToast(msg, 'error');
    }
  };

  const getStatusBadge = (status: ProblemStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Published
          </span>
        );
      case 'reviewed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Reviewed
          </span>
        );
      case 'draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Draft (v{selectedDetail?.problem._id === selectedProblemId ? selectedDetail.problem.contentVersion : 1})
          </span>
        );
      case 'archived':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
            Archived
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="Admin Question Studio"
          subtitle="Manage competitive programming challenges, test cases, and private editorial solutions backed directly by MongoDB."
        />

        {/* Action Header: Create, AI Generator, Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Draft Problem
            </button>

            <button
              type="button"
              onClick={() => setIsAiDraftOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" /> AI Draft Generator
            </button>
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProblemStatus | '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as ProblemDifficulty | '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <button
              type="button"
              onClick={loadProblems}
              title="Refresh list"
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left List (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                Problems ({problems.length})
              </span>
              <span className="text-[11px] text-gray-400">Total in DB: {total}</span>
            </div>

            {isLoading && (
              <div className="py-12 text-center text-xs text-gray-400">
                <Sparkles className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                Loading problems from MongoDB...
              </div>
            )}

            {!isLoading && problems.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500 space-y-1">
                <p className="font-medium">No problems found.</p>
                <p className="text-[11px] text-gray-400">Create a problem manually or generate one with AI above.</p>
              </div>
            )}

            {!isLoading && problems.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[620px] overflow-auto">
                {problems.map((p) => {
                  const isSelected = selectedProblemId === p._id;
                  return (
                    <div
                      key={p._id}
                      onClick={() => loadProblemDetail(p._id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                          {p.title}
                        </span>
                        {getStatusBadge(p.status)}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                        <span className="font-mono text-blue-600 dark:text-blue-400 uppercase font-semibold">
                          {p.difficulty}
                        </span>
                        <span>•</span>
                        <span>{p.topic}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-gray-400">v{p.contentVersion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Detail Pane (7 cols) */}
          <div className="lg:col-span-7">
            {!selectedDetail && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-gray-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600" />
                <p className="font-medium text-gray-600 dark:text-slate-300">Select a problem to inspect details</p>
                <p className="text-[11px]">View testcases, private solutions, perform reviews, and publish to students.</p>
              </div>
            )}

            {detailLoading && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-gray-400">
                <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                Loading problem details and test cases...
              </div>
            )}

            {!detailLoading && selectedDetail && (
              <div className="space-y-5">
                {/* Problem Status & Action Banner */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(selectedDetail.problem.status)}
                        <span className="text-xs text-gray-400 font-mono">
                          ID: {selectedDetail.problem._id}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedDetail.problem.title}
                      </h2>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        Slug: <span className="font-mono text-blue-600 dark:text-blue-400">/coding/problems/{selectedDetail.problem.slug}</span>
                      </div>
                    </div>

                    {/* Review & Publish Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsReviewOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        Review Problem
                      </button>

                      {selectedDetail.problem.status === 'reviewed' && (
                        <button
                          type="button"
                          onClick={handlePublish}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                        >
                          Publish to Students
                        </button>
                      )}

                      {selectedDetail.problem.status === 'published' && (
                        <button
                          type="button"
                          onClick={handleArchive}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Metadata Banner */}
                  {selectedDetail.problem.reviewedAt && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Reviewed Version {selectedDetail.problem.reviewedVersion} by Admin
                      </div>
                      <div className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                        Method: {selectedDetail.problem.verificationMethod} • {selectedDetail.problem.reviewNotes}
                      </div>
                    </div>
                  )}

                  {/* Statement Preview */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Statement</span>
                    <p className="text-xs text-gray-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-40 overflow-auto bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      {selectedDetail.problem.statement}
                    </p>
                  </div>
                </div>

                {/* Test Cases Panel */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      Test Cases ({selectedDetail.testCases?.length || 0})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddTestCaseOpen(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Case
                    </button>
                  </div>

                  {(!selectedDetail.testCases || selectedDetail.testCases.length === 0) && (
                    <p className="text-xs text-gray-400 italic">No test cases recorded yet.</p>
                  )}

                  <div className="space-y-3 max-h-80 overflow-auto pr-1">
                    {selectedDetail.testCases?.map((tc, idx) => (
                      <div
                        key={tc._id}
                        className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                tc.visibility === 'sample'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}
                            >
                              {tc.visibility}
                            </span>
                            <span className="font-mono text-gray-500">#{tc.order}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTestCase(tc._id)}
                            className="text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete test case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                          <div>
                            <span className="text-[10px] text-gray-400 block mb-0.5">Input:</span>
                            <pre className="p-2 bg-slate-950 text-slate-200 rounded max-h-20 overflow-auto whitespace-pre">
                              {tc.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block mb-0.5">Output:</span>
                            <pre className="p-2 bg-slate-950 text-emerald-400 rounded max-h-20 overflow-auto whitespace-pre">
                              {tc.expectedOutput}
                            </pre>
                          </div>
                        </div>

                        {tc.explanation && (
                          <div className="text-[10px] text-gray-500 font-sans italic">
                            Explanation: {tc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Private Content / Solutions Panel */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Private Content & Reference Solutions
                  </h3>

                  {!selectedDetail.privateContent && (
                    <p className="text-xs text-gray-400 italic">No private solutions or hints recorded yet.</p>
                  )}

                  {selectedDetail.privateContent && (
                    <div className="space-y-3 text-xs">
                      {selectedDetail.privateContent.referenceSolutions?.map((sol, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 space-y-2"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                            <span className="uppercase text-purple-600 dark:text-purple-400">
                              {sol.language} Reference Solution
                            </span>
                            <span>
                              {sol.timeComplexity} • {sol.spaceComplexity}
                            </span>
                          </div>
                          <pre className="p-2.5 bg-slate-950 text-slate-100 rounded-lg font-mono text-[11px] max-h-36 overflow-auto whitespace-pre">
                            {sol.solutionCode}
                          </pre>
                        </div>
                      ))}

                      {selectedDetail.privateContent.editorial && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-1">
                          <span className="font-bold text-gray-700 dark:text-slate-300 block uppercase text-[10px]">
                            Editorial Approach
                          </span>
                          <p className="text-xs text-gray-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {selectedDetail.privateContent.editorial}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal 1: Create Manual Problem */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create Draft Problem</h3>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Invert Binary Tree"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={createForm.difficulty}
                      onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value as ProblemDifficulty })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Topic</label>
                    <input
                      type="text"
                      required
                      value={createForm.topic}
                      onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                      placeholder="e.g. Trees, Dynamic Programming"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. recursion, binary-tree, dfs"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Problem Statement</label>
                  <textarea
                    rows={4}
                    required
                    value={createForm.statement}
                    onChange={(e) => setCreateForm({ ...createForm, statement: e.target.value })}
                    placeholder="Detailed problem specification..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Input Format</label>
                    <textarea
                      rows={2}
                      value={createForm.inputFormat}
                      onChange={(e) => setCreateForm({ ...createForm, inputFormat: e.target.value })}
                      placeholder="e.g. Space-separated integers"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Output Format</label>
                    <textarea
                      rows={2}
                      value={createForm.outputFormat}
                      onChange={(e) => setCreateForm({ ...createForm, outputFormat: e.target.value })}
                      placeholder="e.g. Single integer output"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Constraints</label>
                  <input
                    type="text"
                    value={createForm.constraints}
                    onChange={(e) => setCreateForm({ ...createForm, constraints: e.target.value })}
                    placeholder="e.g. 1 <= N <= 10^5"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Save Draft Problem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: AI Draft Generator */}
        {isAiDraftOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Question Draft Generator</h3>
                </div>
                <button type="button" onClick={() => setIsAiDraftOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Gemini will synthesize an original stdin/stdout problem specification with C++, Java, and Python
                scaffolding, sample & hidden test cases, progressive hints, and optimal reference solutions.
              </p>

              <form onSubmit={handleAiDraftSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Core Topic</label>
                  <input
                    type="text"
                    required
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Dynamic Programming, Graphs, Sliding Window"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={aiForm.difficulty}
                      onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as ProblemDifficulty })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Subtopic (optional)</label>
                    <input
                      type="text"
                      value={aiForm.subtopic}
                      onChange={(e) => setAiForm({ ...aiForm, subtopic: e.target.value })}
                      placeholder="e.g. Monotonic Queue"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Additional Constraints</label>
                  <input
                    type="text"
                    value={aiForm.additionalConstraints}
                    onChange={(e) => setAiForm({ ...aiForm, additionalConstraints: e.target.value })}
                    placeholder="e.g. Ensure O(N log N) is required, avoid O(N^2)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiDraftOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Synthesizing Draft...
                      </>
                    ) : (
                      'Generate Problem Draft'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Review Form */}
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Record Formal Review</h3>
                <button type="button" onClick={() => setIsReviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Verification Method</label>
                  <input
                    type="text"
                    required
                    value={reviewMethod}
                    onChange={(e) => setReviewMethod(e.target.value)}
                    placeholder="e.g. Manual verified solution"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Review Notes</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Notes regarding testcases and edge-case validation..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-sans"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReviewing}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isReviewing ? 'Saving Review...' : 'Approve Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Add Test Case */}
        {isAddTestCaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Test Case</h3>
                <button type="button" onClick={() => setIsAddTestCaseOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTestCaseSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Visibility</label>
                  <select
                    value={tcVisibility}
                    onChange={(e) => setTcVisibility(e.target.value as 'sample' | 'hidden')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-medium"
                  >
                    <option value="sample">Sample (Public to students)</option>
                    <option value="hidden">Hidden (Private judging case)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Input Data (stdin)</label>
                  <textarea
                    rows={3}
                    required
                    value={tcInput}
                    onChange={(e) => setTcInput(e.target.value)}
                    placeholder="Exact input lines..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Expected Output (stdout)</label>
                  <textarea
                    rows={3}
                    required
                    value={tcExpectedOutput}
                    onChange={(e) => setTcExpectedOutput(e.target.value)}
                    placeholder="Exact output..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-mono"
                  />
                </div>

                {tcVisibility === 'sample' && (
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-slate-300 mb-1">Explanation (optional)</label>
                    <input
                      type="text"
                      value={tcExplanation}
                      onChange={(e) => setTcExplanation(e.target.value)}
                      placeholder="Why this sample produces this output..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-sans"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTestCaseOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingTc}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isAddingTc ? 'Saving...' : 'Add Test Case'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

