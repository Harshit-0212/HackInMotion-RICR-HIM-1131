import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  FileCode,
  Layers,
  Terminal,
  Clock,
  HardDrive,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { codingService } from '@/services/codingService';
import type {
  PublicCodingProblemDetail,
  SupportedCodingLanguage,
  RunCodeResult,
} from '@/types/coding';
import { useToast } from '@/store/ToastContext';

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

  // Editor states
  const [selectedLang, setSelectedLang] = useState<SupportedCodingLanguage | null>(null);
  const [code, setCode] = useState<string>('');
  const [userCodeByLang, setUserCodeByLang] = useState<Partial<Record<SupportedCodingLanguage, string>>>({});
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  const [inputVal, setInputVal] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<'input' | 'output'>('input');
  const [activeMobileTab, setActiveMobileTab] = useState<'problem' | 'code'>('problem');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedCaseIdx, setCopiedCaseIdx] = useState<number | null>(null);
  const [constraintsOpen, setConstraintsOpen] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  // 1. Fetch problem details
  const loadProblem = () => {
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
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Problem not found or not published.';
        setProblemError(message);
      })
      .finally(() => {
        setIsLoadingProblem(false);
      });
  };

  // 2. Fetch capabilities
  const loadCapabilities = () => {
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
  };

  useEffect(() => {
    loadProblem();
    loadCapabilities();
  }, [slug]);

  // Compute available languages (Intersection of problem languages and verified capabilities)
  const availableLanguages: SupportedCodingLanguage[] = (problem?.supportedLanguages || []).filter((l) =>
    verifiedLangs.includes(l)
  );

  // Initialize or reconcile selected language when problem or capabilities arrive
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

  // Update starter code when language switches (preserves user code)
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
    setTimeout(() => setIsSwitchingLang(false), 80);
  };

  const handleResetCode = () => {
    if (selectedLang) {
      const starter = problem?.starterCodeByLanguage?.[selectedLang] || '';
      setCode(starter);
      setUserCodeByLang((prev) => ({ ...prev, [selectedLang]: starter }));
      showToast('Starter code restored.', 'info');
    }
  };

  const handleLoadSample = (sampleInput: string) => {
    setInputVal(sampleInput);
    setActiveBottomTab('input');
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
    try {
      const res = await codingService.runCode({
        language: selectedLang,
        code,
        input: inputVal,
      });
      setRunResult(res);
      setActiveBottomTab('output');
      if (window.innerWidth < 1024) {
        setActiveMobileTab('code');
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setRunResult({
        status: 'error',
        output: '',
        error: msg,
      });
      setActiveBottomTab('output');
    } finally {
      setIsRunning(false);
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

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Easy
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Medium
          </span>
        );
      case 'hard':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
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
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Problem Unavailable</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            {problemError || 'This challenge could not be found or is not published.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadProblem}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
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
      </AppLayout>
    );
  }

  const lineCount = code.split('\n').length;
  const isRunDisabled = isRunning || isLoadingCaps || !selectedLang || availableLanguages.length === 0;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Compact Page Header (with skeleton for loading) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/app/coding"
              aria-label="Back to problems"
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            {isLoadingProblem ? (
              <div className="flex items-center gap-2.5 animate-pulse">
                <div className="h-5 w-44 sm:w-64 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {problem?.title}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  {problem && getDifficultyBadge(problem.difficulty)}
                  <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {problem?.topic}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveMobileTab('problem')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeMobileTab === 'problem'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Problem
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('code')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeMobileTab === 'code'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                Code & Run
              </button>
            </div>
          </div>
        </div>

        {/* Two-Panel Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0">
          {/* Left Panel: Problem Statement & Examples */}
          <div
            className={`lg:col-span-5 min-w-0 space-y-4 ${
              activeMobileTab === 'problem' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-5 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
              {isLoadingProblem ? (
                /* Skeleton for Problem Panel */
                <div className="space-y-5 animate-pulse" aria-busy="true">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/60" />
                    <div className="h-3 w-5/6 rounded bg-slate-200/70 dark:bg-slate-800/60" />
                    <div className="h-3 w-4/6 rounded bg-slate-200/70 dark:bg-slate-800/60" />
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                    <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-28 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Problem Statement */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-500" /> Description
                    </h2>
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
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
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
                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Output:</span>
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
              )}
            </div>
          </div>

          {/* Right Panel: Editor + Input/Output Workspace */}
          <div
            className={`lg:col-span-7 min-w-0 space-y-4 ${
              activeMobileTab === 'code' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Editor Container */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col">
              {/* Minimal Editor Toolbar */}
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Language Selection / Loading Area */}
                <div className="flex items-center gap-2 min-w-0">
                  <label htmlFor="language-select" className="text-gray-500 font-medium text-[11px] shrink-0">
                    Language:
                  </label>

                  {isLoadingCaps ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      <span className="text-[11px]">Loading languages…</span>
                    </div>
                  ) : capsError && availableLanguages.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <span className="text-[11px]">No execution languages available.</span>
                      <button
                        type="button"
                        onClick={loadCapabilities}
                        title="Retry loading capabilities"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  ) : availableLanguages.length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">No execution languages are currently available.</span>
                  ) : (
                    <select
                      id="language-select"
                      value={selectedLang || ''}
                      onChange={(e) => handleLanguageChange(e.target.value as SupportedCodingLanguage)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold uppercase text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availableLanguages.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetCode}
                    disabled={!selectedLang}
                    title="Restore default starter code"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-[11px] disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>

                  <button
                    type="button"
                    disabled={isRunDisabled}
                    onClick={handleRunCode}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
                    {isRunning ? 'Running…' : 'Run Code'}
                  </button>
                </div>
              </div>

              {/* Monospace Code Editor Area */}
              <div className="relative bg-slate-950 flex font-mono text-xs min-h-[300px]">
                {/* Lightweight loading state when switching language */}
                {isSwitchingLang && (
                  <div className="absolute inset-0 z-10 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center gap-2 text-xs text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading starter template…</span>
                  </div>
                )}

                {/* Line Numbers */}
                <div
                  aria-hidden="true"
                  className="py-3 px-2 bg-slate-900/60 text-slate-600 select-none text-right font-mono text-[11px] leading-relaxed shrink-0 border-r border-slate-800/80"
                  style={{ minWidth: '2.5rem' }}
                >
                  {Array.from({ length: Math.max(12, lineCount) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Editor Textarea */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    isLoadingProblem
                      ? 'Loading workspace...'
                      : selectedLang
                      ? 'Type or paste your code here...'
                      : 'Select a language above to start coding...'
                  }
                  rows={16}
                  className="w-full p-3 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-blue-600/40 overflow-x-auto whitespace-pre"
                  spellCheck={false}
                />
              </div>

              {/* Status bar */}
              <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {lineCount} lines • {code.length} chars
                </span>
                <span className="text-slate-500">
                  {selectedLang ? `Standard I/O (${selectedLang})` : 'Awaiting language selection'}
                </span>
              </div>
            </div>

            {/* Input / Output Tabbed Panel */}
            <div
              ref={outputRef}
              className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
            >
              {/* Tabs */}
              <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('input')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      activeBottomTab === 'input'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Custom Input
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('output')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                      activeBottomTab === 'output'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Output</span>
                    {runResult && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          runResult.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    )}
                  </button>
                </div>

                {activeBottomTab === 'output' && (runResult?.output || runResult?.error) && (
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
                  >
                    {copiedOutput ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Output
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Tab 1: Custom Input */}
              {activeBottomTab === 'input' && (
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Provide standard input (stdin) for your execution:</span>
                    {problem?.sampleCases && problem.sampleCases.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase">Load:</span>
                        {problem.sampleCases.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleLoadSample(problem.sampleCases[i].input)}
                            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-[10px] font-mono text-gray-700 dark:text-slate-300"
                          >
                            Ex {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Enter custom stdin here..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 text-xs font-mono text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-pre"
                  />
                </div>
              )}

              {/* Tab 2: Output */}
              {activeBottomTab === 'output' && (
                <div className="p-4 space-y-3 font-mono text-xs">
                  {/* Status header banner */}
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running your code in sandbox...</span>
                    </div>
                  ) : !runResult ? (
                    <div className="text-gray-400 dark:text-slate-500 italic py-4 text-center">
                      Click "Run Code" to compile and execute your solution.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          {runResult.status === 'success' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-sans">
                                Execution completed
                              </span>
                            </>
                          ) : runResult.status === 'compile_error' ? (
                            <>
                              <XCircle className="w-4 h-4 text-rose-500" />
                              <span className="font-semibold text-rose-700 dark:text-rose-400 font-sans">
                                Compilation error
                              </span>
                            </>
                          ) : runResult.status === 'timeout' ? (
                            <>
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span className="font-semibold text-amber-700 dark:text-amber-400 font-sans">
                                Execution timed out
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                              <span className="font-semibold text-rose-700 dark:text-rose-400 font-sans">
                                Runtime error
                              </span>
                            </>
                          )}
                        </div>

                        {(runResult.time || runResult.memory) && (
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            {runResult.time && <span>Time: {runResult.time}s</span>}
                            {runResult.memory && <span>Memory: {runResult.memory}KB</span>}
                          </div>
                        )}
                      </div>

                      {/* Actual standard output */}
                      {runResult.output ? (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Program Output:</span>
                          <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 max-h-48 overflow-auto whitespace-pre leading-relaxed border border-slate-800">
                            {runResult.output}
                          </pre>
                        </div>
                      ) : (
                        runResult.status === 'success' && (
                          <p className="text-[11px] text-gray-400 italic">No output produced.</p>
                        )
                      )}

                      {/* Error details if any */}
                      {runResult.error && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-500">Error Details:</span>
                          <pre className="p-3 rounded-xl bg-rose-950/40 text-rose-300 max-h-48 overflow-auto whitespace-pre text-[11px] leading-relaxed border border-rose-900/60">
                            {runResult.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
