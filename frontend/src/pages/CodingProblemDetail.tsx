import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Code2,
  Clock,
  HardDrive,
  Layers,
  Sparkles,
  ChevronLeft,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  Info,
  Terminal,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { codingService } from '@/services/codingService';
import type { PublicCodingProblemDetail, SupportedCodingLanguage } from '@/types/coding';
import { useToast } from '@/store/ToastContext';

export function CodingProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { showToast } = useToast();

  const [problem, setProblem] = useState<PublicCodingProblemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected language for starter code scaffolding
  const [selectedLang, setSelectedLang] = useState<SupportedCodingLanguage>('cpp');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCaseIdx, setCopiedCaseIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    codingService
      .getProblemBySlug(slug)
      .then((data) => {
        setProblem(data);
        if (data.supportedLanguages?.length > 0) {
          setSelectedLang(data.supportedLanguages[0]);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Problem not found or not published.';
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleCopyStarterCode = async () => {
    if (!problem?.starterCodeByLanguage?.[selectedLang]) return;
    try {
      await navigator.clipboard.writeText(problem.starterCodeByLanguage[selectedLang]);
      setCopiedCode(true);
      showToast('Starter code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyTestCaseInput = async (inputStr: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(inputStr);
      setCopiedCaseIdx(idx);
      setTimeout(() => setCopiedCaseIdx(null), 1800);
    } catch {
      // fallback
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-gray-500 dark:text-slate-400">Loading problem specification...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !problem) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Problem Unavailable</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            {error || 'This challenge could not be found or has not been published.'}
          </p>
          <Link
            to="/app/coding"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Practice Library
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
          <Link to="/app/coding" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Practice Library
          </Link>
          <span>/</span>
          <span className="text-gray-800 dark:text-slate-200 font-medium truncate">{problem.title}</span>
        </div>

        {/* Top Header Summary Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    problem.difficulty === 'easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : problem.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {problem.difficulty}
                </span>

                <span className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> {problem.topic}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{problem.title}</h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5" title="Execution time limit">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{problem.executionLimits.timeLimitMs} ms</span>
              </div>
              <div className="flex items-center gap-1.5" title="Memory limit">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <span>{problem.executionLimits.memoryLimitMb} MB</span>
              </div>
            </div>
          </div>

          {problem.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {problem.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid: Problem Statement (Left 7 cols) & Scaffolding (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Problem Description & Testcases */}
          <div className="lg:col-span-7 space-y-6">
            {/* Statement Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-500" /> Problem Statement
                </h3>
                <div className="text-xs sm:text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {problem.statement}
                </div>
              </div>

              {/* Input Format */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                  Input Format
                </h4>
                <div className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  {problem.inputFormat}
                </div>
              </div>

              {/* Output Format */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                  Output Format
                </h4>
                <div className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  {problem.outputFormat}
                </div>
              </div>

              {/* Constraints */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                  Constraints
                </h4>
                <pre className="text-xs font-mono text-gray-700 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800 overflow-x-auto whitespace-pre-wrap">
                  {problem.constraints}
                </pre>
              </div>
            </div>

            {/* Public Sample Test Cases */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-500" /> Sample Test Cases ({problem.sampleCases?.length || 0})
                </h3>
                <span className="text-[11px] text-gray-400">Public verification cases</span>
              </div>

              {(!problem.sampleCases || problem.sampleCases.length === 0) && (
                <p className="text-xs text-gray-400 italic">No public sample cases provided.</p>
              )}

              {problem.sampleCases?.map((sc, idx) => (
                <div
                  key={sc.caseKey || idx}
                  className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                    <span>Sample Case {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyTestCaseInput(sc.input, idx)}
                      className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
                    >
                      {copiedCaseIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" /> Copied Input
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Input
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">
                        Input:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 overflow-x-auto whitespace-pre">
                        {sc.input}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">
                        Expected Output:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 overflow-x-auto whitespace-pre">
                        {sc.expectedOutput}
                      </pre>
                    </div>
                  </div>

                  {sc.explanation && (
                    <div className="text-[11px] text-gray-600 dark:text-slate-400 font-sans border-t border-gray-200 dark:border-slate-800 pt-2">
                      <span className="font-semibold text-gray-700 dark:text-slate-300 mr-1">Explanation:</span>
                      {sc.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Starter Code & Scaffolding */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Starter Code
                  </span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900 text-xs">
                  {problem.supportedLanguages?.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold transition-colors ${
                        selectedLang === lang
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Scaffolding Display */}
              <div className="relative bg-slate-950 p-4 font-mono text-xs">
                <pre className="text-slate-100 overflow-x-auto max-h-[460px] leading-relaxed">
                  {problem.starterCodeByLanguage?.[selectedLang] || '// No starter code available for this language'}
                </pre>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Full-program standard I/O</span>
                  <button
                    type="button"
                    onClick={handleCopyStarterCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Scaffolding
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Disclaimer / Notice */}
              <div className="p-4 bg-gray-50/70 dark:bg-slate-800/40 text-[11px] text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Code execution and online judging are handled via isolated sandboxes in a subsequent phase. Copy
                  the template above into your local IDE or the Cadence Code Debugger to experiment.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

