import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Menu,
  RotateCcw,
  Play,
  Send,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  Lightbulb,
  Clock,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PanelErrorBoundary } from '@/components/ui/PanelErrorBoundary';
import { codingService } from '@/services/codingService';
import type {
  PublicCodingProblemDetail,
  SupportedCodingLanguage,
  RunCodeResult,
} from '@/types/coding';
import { useToast } from '@/store/ToastContext';

const DEFAULT_H_SPLIT = 42; // 42% problem panel, 58% code editor
const DEFAULT_V_SPLIT = 32; // 32% console height, 68% code editor
const STORAGE_H_KEY = 'cadence_workspace_h_split';
const STORAGE_V_KEY = 'cadence_workspace_v_split';

function getStoredNumber(key: string, fallback: number, min: number, max: number): number {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function CodingProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { showToast } = useToast();

  const [problem, setProblem] = useState<PublicCodingProblemDetail | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);

  // Capabilities states
  const [verifiedLangs, setVerifiedLangs] = useState<SupportedCodingLanguage[]>([]);
  const [isLoadingCaps, setIsLoadingCaps] = useState(true);
  const [capsError, setCapsError] = useState<string | null>(null);

  // Split pane states
  const [hSplit, setHSplit] = useState<number>(() => getStoredNumber(STORAGE_H_KEY, DEFAULT_H_SPLIT, 25, 65));
  const [vSplit, setVSplit] = useState<number>(() => getStoredNumber(STORAGE_V_KEY, DEFAULT_V_SPLIT, 15, 65));
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // Problem panel tabs
  const [problemTab, setProblemTab] = useState<'description' | 'hints'>('description');

  // Editor states
  const [selectedLang, setSelectedLang] = useState<SupportedCodingLanguage | null>(null);
  const [code, setCode] = useState<string>('');
  const [userCodeByLang, setUserCodeByLang] = useState<Partial<Record<SupportedCodingLanguage, string>>>({});
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  // Console states
  const [inputVal, setInputVal] = useState<string>('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'input' | 'output' | 'submit'>('input');
  const [activeMobileTab, setActiveMobileTab] = useState<'problem' | 'code'>('problem');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedCaseIdx, setCopiedCaseIdx] = useState<number | null>(null);
  const [constraintsOpen, setConstraintsOpen] = useState(false);

  // Solve status & optimization states
  const [solvedStatus, setSolvedStatus] = useState<{
    solved: boolean;
    submissionId?: string;
    verdict?: string;
    solvedAt?: string;
    language?: string;
    code?: string;
  } | null>(null);
  const [optimizeMode, setOptimizeMode] = useState(false);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    submissionId: string;
    verdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'timeout' | 'error';
    passedTests: number;
    totalTests: number;
    compileError?: string;
    publicResults: {
      caseKey: string;
      passed: boolean;
      status: string;
      actualOutput?: string;
      expectedOutput?: string;
    }[];
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Save split preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_H_KEY, hSplit.toString());
    } catch {
      // ignore
    }
  }, [hSplit]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_V_KEY, vSplit.toString());
    } catch {
      // ignore
    }
  }, [vSplit]);

  // Load problem details
  const loadProblem = useCallback(() => {
    if (!slug) return;
    setIsLoadingProblem(true);
    setProblemError(null);
    codingService
      .getProblemBySlug(slug)
      .then((data) => {
        setProblem(data);
        if (data.sampleCases?.length > 0) {
          setInputVal(data.sampleCases[0].input);
        }
        // Fetch submission status
        codingService.getSubmissionStatus(slug).then((status) => {
          setSolvedStatus(status);
          if (status.solved && status.code) {
            setCode(status.code);
            if (status.language) setSelectedLang(status.language as any);
          }
        }).catch(() => {});
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Problem not found or not published.';
        setProblemError(message);
      })
      .finally(() => {
        setIsLoadingProblem(false);
      });
  }, [slug]);

  // Load capabilities
  const loadCapabilities = useCallback(() => {
    setIsLoadingCaps(true);
    setCapsError(null);
    codingService
      .getCapabilities()
      .then((res) => {
        setVerifiedLangs(res.supportedLanguages || []);
      })
      .catch((err: unknown) => {
        console.warn('Could not fetch capabilities:', err);
        setCapsError('Failed to load language capabilities.');
      })
      .finally(() => {
        setIsLoadingCaps(false);
      });
  }, []);

  useEffect(() => {
    loadProblem();
    loadCapabilities();
  }, [loadProblem, loadCapabilities]);

  // Compute available languages
  const availableLanguages: SupportedCodingLanguage[] = (problem?.supportedLanguages || []).filter((l) =>
    verifiedLangs.includes(l)
  );

  // Initialize selected language
  useEffect(() => {
    if (availableLanguages.length > 0) {
      if (!selectedLang || !availableLanguages.includes(selectedLang)) {
        const preferred = availableLanguages.includes('python') ? 'python' : availableLanguages[0];
        setSelectedLang(preferred);
        const initialCode = problem?.starterCodeByLanguage?.[preferred] || '';
        setCode(initialCode);
        setUserCodeByLang((prev) => ({ ...prev, [preferred]: initialCode }));
      }
    }
  }, [availableLanguages, selectedLang, problem]);

  // Switch language
  const handleLanguageChange = (lang: SupportedCodingLanguage) => {
    if (selectedLang) {
      setUserCodeByLang((prev) => ({ ...prev, [selectedLang]: code }));
    }
    setIsSwitchingLang(true);
    setSelectedLang(lang);

    const cachedCode = userCodeByLang[lang];
    if (typeof cachedCode === 'string') {
      setCode(cachedCode);
    } else if (problem?.starterCodeByLanguage?.[lang]) {
      setCode(problem.starterCodeByLanguage[lang] || '');
    } else {
      setCode('');
    }
    setTimeout(() => setIsSwitchingLang(false), 60);
  };

  const handleResetCode = () => {
    if (selectedLang) {
      const starter = problem?.starterCodeByLanguage?.[selectedLang] || '';
      setCode(starter);
      setUserCodeByLang((prev) => ({ ...prev, [selectedLang]: starter }));
      showToast('Starter code restored.', 'info');
    }
  };

  const handleResetLayout = () => {
    setHSplit(DEFAULT_H_SPLIT);
    setVSplit(DEFAULT_V_SPLIT);
    setIsConsoleCollapsed(false);
    showToast('Workspace layout reset to default.', 'info');
  };

  const handleLoadSample = (sampleInput: string) => {
    setInputVal(sampleInput);
    setActiveConsoleTab('input');
    if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    showToast('Sample input loaded.', 'info');
  };

  const handleRunCode = async () => {
    if (!selectedLang) {
      showToast('No execution language is currently selected.', 'error');
      return;
    }
    if (!code.trim()) {
      showToast('Please write code before running.', 'error');
      return;
    }
    setIsRunning(true);
    if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    try {
      const res = await codingService.runCode({
        language: selectedLang,
        code,
        input: inputVal,
      });
      setRunResult(res);
      setActiveConsoleTab('output');
      if (window.innerWidth < 1024) {
        setActiveMobileTab('code');
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not run code';
      setRunResult({
        status: 'request_error',
        output: '',
        error: `Could not run code: ${msg}`,
      });
      setActiveConsoleTab('output');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem || !selectedLang || !code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setActiveConsoleTab('submit');
    if (isConsoleCollapsed) setIsConsoleCollapsed(false);

    try {
      const res = await codingService.submitProblem(problem.slug, {
        language: selectedLang,
        code,
        ...(optimizeMode ? { optimize: true } : {}),
      } as any);
      setSubmitResult(res);
      if (res.verdict === 'accepted') {
        showToast(optimizeMode ? 'Optimization accepted! Your solution was evaluated.' : 'Accepted! All test cases passed.', 'success');
        setSolvedStatus({
          solved: true,
          submissionId: res.submissionId,
          verdict: 'accepted',
          solvedAt: new Date().toISOString(),
          language: selectedLang,
          code,
        });
        setOptimizeMode(false);
      } else if (res.verdict === 'wrong_answer') {
        showToast(`Wrong Answer (${res.passedTests}/${res.totalTests} tests passed)`, 'error');
      } else if (res.verdict === 'compile_error') {
        showToast('Compilation Error', 'error');
      } else if (res.verdict === 'timeout') {
        showToast('Time Limit Exceeded', 'error');
      } else {
        showToast('Submission execution error', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubmitResult({
        submissionId: `err_${Date.now()}`,
        verdict: 'error',
        passedTests: 0,
        totalTests: 0,
        compileError: msg,
        publicResults: [],
      });
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOutput = async () => {
    const textToCopy = runResult?.output || runResult?.error || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedOutput(true);
      showToast('Output copied to clipboard', 'success');
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyTestCaseInput = async (inputStr: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(inputStr);
      setCopiedCaseIdx(idx);
      setTimeout(() => setCopiedCaseIdx(null), 1800);
    } catch {
      // ignore
    }
  };

  // Horizontal Pointer Drag Handlers
  const handlePointerDownH = (e: React.PointerEvent) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    setIsDraggingH(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = moveEvent.clientX - rect.left;
      const percent = (pointerX / rect.width) * 100;
      // Clamp between 25% and 65%
      const clamped = Math.max(25, Math.min(65, percent));
      setHSplit(clamped);
    };

    const onPointerUp = () => {
      setIsDraggingH(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Vertical Pointer Drag Handlers (within right panel)
  const handlePointerDownV = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingV(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      const pointerY = rect.bottom - moveEvent.clientY;
      const percent = (pointerY / rect.height) * 100;
      // Clamp console height between 15% and 60%
      const clamped = Math.max(15, Math.min(60, percent));
      setVSplit(clamped);
      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
    };

    const onPointerUp = () => {
      setIsDraggingV(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Easy
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Medium
          </span>
        );
      case 'hard':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  // If problem fetch failed completely
  if (!isLoadingProblem && (problemError || !problem)) {
    return (
      <AppLayout focusMode={true}>
        <div className="h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Problem Unavailable</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {problemError || 'This challenge could not be found or is not published.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={loadProblem}
                className="btn-render-sweep inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] text-xs font-semibold shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
              </button>
              <Link
                to="/app/coding"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Library
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const lineCount = code.split('\n').length;
  const isRunDisabled = isRunning || isLoadingCaps || !selectedLang || availableLanguages.length === 0;

  // Stored hints if any exist in the problem model (progressive hints / hints)
  const hasStoredHints = Array.isArray((problem as unknown as { hints?: unknown[] })?.hints) &&
    ((problem as unknown as { hints: unknown[] }).hints.length > 0);

  return (
    <AppLayout focusMode={true}>
      <div className="h-screen w-full flex flex-col bg-[var(--nova-bg)] dark:bg-[#0B1220] overflow-hidden select-text">
        {/* ===================================================================
            WORKSPACE TOP TOOLBAR
            - Compact, single-row header
            - Navigation drawer menu button
            - Back to Problems
            - Title, Difficulty badge, Topic
            - Reset Layout, Run Code, Submit (Honest Server-side Status)
            =================================================================== */}
        <header className="shrink-0 h-12 px-3 sm:px-4 border-b border-gray-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md flex items-center justify-between gap-2 z-20">
          {/* Left: Nav & Problem Details */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Open Drawer Navigation Trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('cadence:open-navigation'))}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Back to Library */}
            <Link
              to="/app/coding"
              title="Back to Problems Library"
              aria-label="Back to Problems"
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Problems</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 shrink-0 mx-1" />

            {/* Problem Title & Badges */}
            {isLoadingProblem ? (
              <div className="flex items-center gap-2 animate-pulse min-w-0">
                <div className="h-4 w-36 sm:w-56 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                  {problem?.title}
                </span>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {problem && getDifficultyBadge(problem.difficulty)}
                  <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    • {problem?.topic}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveMobileTab('problem')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMobileTab === 'problem'
                    ? 'bg-white dark:bg-slate-900 text-[#6542C5] dark:text-[#B59AF7] shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Problem
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('code')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMobileTab === 'code'
                    ? 'bg-white dark:bg-slate-900 text-[#6542C5] dark:text-[#B59AF7] shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Code & Run
              </button>
            </div>

            {/* Reset Layout button (Desktop) */}
            <button
              type="button"
              onClick={handleResetLayout}
              title="Reset workspace panels to default proportions"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>

            {/* Run Code Button */}
            <button
              type="button"
              disabled={isRunDisabled}
              onClick={handleRunCode}
              title="Compile & execute code with custom input"
              className="btn-render-sweep flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] disabled:opacity-50 font-semibold text-xs shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
              <span>{isRunning ? 'Running…' : 'Run Code'}</span>
            </button>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting || isRunning || !selectedLang || availableLanguages.length === 0}
              onClick={handleSubmitSolution}
              title="Submit code for full server-side judging"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Judging\u2026' : 'Submit'}</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            WORKSPACE MAIN CONTENT AREA
            - Viewport-filling, 100dvh
            - Desktop: Horizontal Resizable Split
            - Mobile: Stacked / Tab Switcher
            =================================================================== */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden"
        >
          {/* ===============================================================
              LEFT PANEL: Problem Details & Hints
              =============================================================== */}
          <div
            style={{ width: window.innerWidth >= 1024 ? `${hSplit}%` : '100%' }}
            className={`min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden ${
              activeMobileTab === 'problem' ? 'flex-1 lg:flex-none' : 'hidden lg:flex'
            }`}
          >
            {/* Panel Tabs Header */}
            <div className="shrink-0 h-10 px-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProblemTab('description')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                    problemTab === 'description'
                      ? 'bg-white dark:bg-slate-900 text-[#6542C5] dark:text-[#B59AF7] shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Description</span>
                </button>

                {hasStoredHints && (
                  <button
                    type="button"
                    onClick={() => setProblemTab('hints')}
                    className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                      problemTab === 'hints'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Hints</span>
                  </button>
                )}
              </div>

              {problem && (
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                  <span>{problem.executionLimits.timeLimitMs}ms</span>
                  <span>•</span>
                  <span>{problem.executionLimits.memoryLimitMb}MB</span>
                </div>
              )}
            </div>

            {/* Panel Content Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5">
              {isLoadingProblem ? (
                /* Skeleton Loader */
                <div className="space-y-5 animate-pulse" aria-busy="true">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/60" />
                    <div className="h-3 w-5/6 rounded bg-slate-200/70 dark:bg-slate-800/60" />
                    <div className="h-3 w-4/6 rounded bg-slate-200/70 dark:bg-slate-800/60" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                    <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                  </div>
                </div>
              ) : problemTab === 'description' ? (
                <>
                  {/* Problem Statement */}
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {problem?.statement}
                    </div>
                  </div>

                  {/* Input & Output Format */}
                  <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">
                        Input Format
                      </h3>
                      <div className="text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 whitespace-pre-line">
                        {problem?.inputFormat}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">
                        Output Format
                      </h3>
                      <div className="text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 whitespace-pre-line">
                        {problem?.outputFormat}
                      </div>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Examples ({problem?.sampleCases?.length || 0})
                    </h3>

                    {problem?.sampleCases?.map((sc, idx) => (
                      <div
                        key={sc.caseKey || idx}
                        className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 p-3.5 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                          <span>Example {idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadSample(sc.input)}
                              className="text-[11px] text-[#6542C5] dark:text-[#B59AF7] hover:underline"
                            >
                              Use as Input
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTestCaseInput(sc.input, idx)}
                              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
                            >
                              {copiedCaseIdx === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Input:</span>
                            <pre className="p-2 bg-slate-950 text-slate-100 rounded-lg overflow-x-auto whitespace-pre">
                              {sc.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Expected Output:</span>
                            <pre className="p-2 bg-slate-950 text-emerald-400 rounded-lg overflow-x-auto whitespace-pre">
                              {sc.expectedOutput}
                            </pre>
                          </div>
                        </div>

                        {sc.explanation && (
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-sans italic pt-1 border-t border-gray-200 dark:border-slate-700/60">
                            {sc.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Collapsible Constraints */}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setConstraintsOpen(!constraintsOpen)}
                      className="flex items-center justify-between w-full py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <span>Constraints & Limits</span>
                      {constraintsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {constraintsOpen && problem && (
                      <div className="mt-2.5 space-y-2 text-xs">
                        <pre className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-gray-100 dark:border-slate-800">
                          {problem.constraints}
                        </pre>
                        <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Time: {problem.executionLimits.timeLimitMs}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5" /> Memory: {problem.executionLimits.memoryLimitMb}MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Hints Tab */
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> Need guidance?
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Try breaking the problem down into smaller sub-steps before checking solutions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===============================================================
              HORIZONTAL DRAG DIVIDER (DESKTOP)
              =============================================================== */}
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize problem and coding panels"
            onPointerDown={handlePointerDownH}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setHSplit((v) => Math.max(25, v - 2));
              if (e.key === 'ArrowRight') setHSplit((v) => Math.min(65, v + 2));
            }}
            className={`hidden lg:flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-gray-100 dark:bg-slate-900 hover:bg-[#6542C5]/20 active:bg-[#6542C5]/40 transition-colors z-10 group select-none ${
              isDraggingH ? 'bg-[#6542C5]/40 ring-1 ring-[#6542C5]' : ''
            }`}
          >
            <div className="h-8 w-1 rounded-full bg-gray-300 dark:bg-slate-700 group-hover:bg-[#6542C5] dark:group-hover:bg-[#B59AF7] transition-colors" />
          </div>

          {/* ===============================================================
              RIGHT PANEL: Full-Height Coding Area + Vertical Console
              =============================================================== */}
          <div
            ref={rightPanelRef}
            className={`flex-1 min-w-0 min-h-0 flex flex-col bg-slate-950 overflow-hidden ${
              activeMobileTab === 'code' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* 1. Code Editor Top Toolbar */}
            <div className="shrink-0 h-10 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 text-xs">
              {/* Language Selection */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-medium text-slate-400 shrink-0">Language:</span>

                {isLoadingCaps ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                    <Loader2 className="w-3 h-3 animate-spin text-[#B59AF7]" />
                    <span className="text-[11px]">Loading languages…</span>
                  </div>
                ) : capsError && availableLanguages.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <span className="text-[11px]">No execution languages available.</span>
                    <button
                      type="button"
                      onClick={loadCapabilities}
                      title="Retry loading capabilities"
                      className="p-1 hover:bg-slate-800 rounded"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                ) : availableLanguages.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">No execution languages are currently available.</span>
                ) : (
                  <select
                    id="language-select"
                    value={selectedLang || ''}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedCodingLanguage)}
                    className="px-2.5 py-0.5 rounded-md border border-slate-700 bg-slate-900 text-xs font-semibold uppercase text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableLanguages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reset starter code action */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetCode}
                  disabled={!selectedLang}
                  title="Restore starter code template"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 2. Code Editor Area */}
            <div
              style={{
                height: isConsoleCollapsed ? 'calc(100% - 36px)' : `${100 - vSplit}%`,
              }}
              className="min-h-0 flex-1 relative bg-slate-950 flex font-mono text-xs overflow-hidden"
            >
              {/* Switching language template indicator */}
              {isSwitchingLang && (
                <div className="absolute inset-0 z-10 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center gap-2 text-xs text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B59AF7]" />
                  <span>Loading starter template…</span>
                </div>
              )}

              {/* Line Numbers */}
              <div
                aria-hidden="true"
                className="py-3 px-2 bg-slate-900/60 text-slate-600 select-none text-right font-mono text-[11px] leading-relaxed shrink-0 border-r border-slate-800/80 overflow-hidden"
                style={{ minWidth: '2.5rem' }}
              >
                {Array.from({ length: Math.max(16, lineCount) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Editor */}
              <textarea
                value={code}
                readOnly={Boolean(solvedStatus?.solved && !optimizeMode)}
                onChange={(e) => setCode(e.target.value)}
                placeholder={
                  isLoadingProblem
                    ? 'Loading workspace...'
                    : selectedLang
                    ? 'Type or paste your code here...'
                    : 'Select a language above to start coding...'
                }
                className="w-full h-full p-3 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-[#6542C5]/40 overflow-auto whitespace-pre"
                spellCheck={false}
              />
            </div>

            {/* 3. Vertical Drag Divider (between Editor and Console) */}
            <div
              role="separator"
              tabIndex={0}
              aria-orientation="horizontal"
              aria-label="Resize editor and console panels"
              onPointerDown={handlePointerDownV}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') setVSplit((v) => Math.min(60, v + 2));
                if (e.key === 'ArrowDown') setVSplit((v) => Math.max(15, v - 2));
              }}
              className={`h-2 shrink-0 cursor-row-resize flex items-center justify-center bg-slate-900 border-y border-slate-800 hover:bg-[#6542C5]/20 active:bg-[#6542C5]/40 transition-colors z-10 group select-none ${
                isDraggingV ? 'bg-[#6542C5]/40' : ''
              }`}
            >
              <div className="w-8 h-1 rounded-full bg-slate-700 group-hover:bg-[#B59AF7] transition-colors" />
            </div>

            {/* 4. Bottom Console (Custom Input, Output, Submission Status) */}
            <div
              ref={outputRef}
              style={{
                height: isConsoleCollapsed ? '36px' : `${vSplit}%`,
              }}
              className="shrink-0 flex flex-col bg-slate-900 border-t border-slate-800 overflow-hidden transition-all duration-150"
            >
              {/* Console Header Tabs */}
              <div className="shrink-0 h-9 px-4 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConsoleTab('input');
                      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                      activeConsoleTab === 'input' && !isConsoleCollapsed
                        ? 'bg-slate-800 text-[#B59AF7]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Input
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveConsoleTab('output');
                      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors flex items-center gap-1.5 ${
                      activeConsoleTab === 'output' && !isConsoleCollapsed
                        ? 'bg-slate-800 text-[#B59AF7]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Output</span>
                    {runResult && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          runResult.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveConsoleTab('submit');
                      if (isConsoleCollapsed) setIsConsoleCollapsed(false);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors flex items-center gap-1.5 ${
                      activeConsoleTab === 'submit' && !isConsoleCollapsed
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Verdict</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeConsoleTab === 'output' && (runResult?.output || runResult?.error) && (
                    <button
                      type="button"
                      onClick={handleCopyOutput}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedOutput ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  )}

                  {/* Collapse / Expand Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                    title={isConsoleCollapsed ? 'Expand console' : 'Collapse console'}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {isConsoleCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Console Body */}
              {!isConsoleCollapsed && (
                <div className="flex-1 min-h-0 overflow-y-auto p-3 text-xs font-mono">
                  <PanelErrorBoundary fallbackTitle="Console view encountered an error">
                  {/* Tab 1: Custom Input */}
                  {activeConsoleTab === 'input' && (
                    <div className="space-y-2 h-full flex flex-col">
                      <div className="shrink-0 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                        <span>Standard Input (stdin):</span>
                        {problem?.sampleCases && problem.sampleCases.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase">Load:</span>
                            {problem.sampleCases.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleLoadSample(problem.sampleCases[i].input)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                              >
                                Ex {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <textarea
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Enter standard input for execution..."
                        className="flex-1 w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre"
                      />
                    </div>
                  )}

                  {/* Tab 2: Output */}
                  {activeConsoleTab === 'output' && (
                    <div className="space-y-3 font-mono">
                      {isRunning ? (
                        <div className="flex items-center gap-2 text-xs text-[#B59AF7] py-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Running your code in execution sandbox...</span>
                        </div>
                      ) : !runResult ? (
                        <div className="text-slate-500 italic py-4 text-center">
                          Click "Run Code" in the toolbar to execute your code.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Status Pill and Execution Metrics */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              {runResult.status === 'success' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span className="font-semibold text-emerald-400 font-sans">
                                    Execution completed
                                  </span>
                                </>
                              ) : runResult.status === 'compile_error' ? (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                  <span className="font-semibold text-rose-400 font-sans">
                                    Compilation error
                                  </span>
                                </>
                              ) : runResult.status === 'timeout' ? (
                                <>
                                  <Clock className="w-4 h-4 text-amber-400" />
                                  <span className="font-semibold text-amber-400 font-sans">
                                    Execution timed out
                                  </span>
                                </>
                              ) : runResult.status === 'request_error' ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-rose-400" />
                                  <span className="font-semibold text-rose-400 font-sans">
                                    Could not run code
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-rose-400" />
                                  <span className="font-semibold text-rose-400 font-sans">
                                    Runtime error
                                  </span>
                                </>
                              )}
                            </div>

                            {(runResult.time || runResult.memory) && (
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                {runResult.time && <span>Time: {runResult.time}s</span>}
                                {runResult.memory && <span>Memory: {runResult.memory}KB</span>}
                              </div>
                            )}
                          </div>

                          {/* Standard Output */}
                          {runResult.output ? (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">Program Output:</span>
                              <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 max-h-40 overflow-auto whitespace-pre leading-relaxed border border-slate-800">
                                {runResult.output}
                              </pre>
                            </div>
                          ) : (
                            runResult.status === 'success' && (
                              <p className="text-[11px] text-slate-500 italic">No output produced.</p>
                            )
                          )}

                          {/* Error Details */}
                          {runResult.error && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-rose-400">Error Details:</span>
                              <pre className="p-3 rounded-lg bg-rose-950/40 text-rose-300 max-h-40 overflow-auto whitespace-pre text-[11px] leading-relaxed border border-rose-900/60">
                                {runResult.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Official Judging / Submit Status */}
                  {activeConsoleTab === 'submit' && (
                    <div className="p-4 space-y-4 font-sans text-xs">
                      {isSubmitting ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                          <div className="text-center">
                            <h4 className="font-bold text-slate-200 text-sm">Evaluating Test Cases&hellip;</h4>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Executing your solution against sample and hidden test suites on the server.
                            </p>
                          </div>
                        </div>
                      ) : submitResult ? (
                        <div className="space-y-3">
                          {/* Verdict Banner */}
                          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                            submitResult.verdict === 'accepted'
                              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                              : submitResult.verdict === 'compile_error'
                              ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                          }`}>
                            {submitResult.verdict === 'accepted' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : submitResult.verdict === 'compile_error' ? (
                              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm uppercase tracking-wide">
                                {submitResult.verdict === 'accepted'
                                  ? 'Accepted'
                                  : submitResult.verdict === 'compile_error'
                                  ? 'Compilation Error'
                                  : submitResult.verdict === 'timeout'
                                  ? 'Time Limit Exceeded'
                                  : 'Wrong Answer'}
                              </h4>
                              <p className="text-xs opacity-90">
                                Passed {submitResult.passedTests} of {submitResult.totalTests} total test cases (including hidden tests).
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Submission ID: {submitResult.submissionId}
                              </p>
                            </div>
                          </div>

                          {/* Compile error box */}
                          {submitResult.compileError && (
                            <div className="p-3 rounded-lg bg-black/50 border border-red-900/50 font-mono text-[11px] text-red-300 whitespace-pre-wrap overflow-x-auto">
                              {submitResult.compileError}
                            </div>
                          )}

                          {/* Public Sample Results List */}
                          {submitResult.publicResults.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Sample Test Cases Evaluation
                              </span>
                              <div className="space-y-1.5">
                                {submitResult.publicResults.map((pr, idx) => (
                                  <div
                                    key={pr.caseKey}
                                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      {pr.passed ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                      )}
                                      <span className="font-medium text-slate-300">
                                        Sample Case #{idx + 1}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                      pr.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                                    }`}>
                                      {pr.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                          <Info className="w-4 h-4 text-[#B59AF7] shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <h4 className="font-semibold text-slate-200">Server-Side Judging Ready</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Click <strong className="text-emerald-400 font-semibold">Submit</strong> in the toolbar to run your code through the server-side judging pipeline across all public and hidden test cases.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </PanelErrorBoundary>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
