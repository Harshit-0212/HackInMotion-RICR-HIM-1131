import { useState, useEffect } from 'react';
import {
  Code2,
  Bug,
  Play,
  Sparkles,
  RotateCcw,
  BookOpen,
  HelpCircle,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DryRunPlayer } from '@/components/debugger/DryRunPlayer';
import { AnalysisResults } from '@/components/debugger/AnalysisResults';
import { DebugHistory } from '@/components/debugger/DebugHistory';
import { DEBUGGER_EXAMPLES } from '@/data/debuggerExamples';
import { debuggerService } from '@/services/debuggerService';
import type {
  SupportedDebuggerLanguage,
  GeminiDebugAnalysisResult,
  StoredDebugSessionSummary,
} from '@/types/debugger';
import { useToast } from '@/store/ToastContext';

export function CodeDebugger() {
  const { showToast } = useToast();

  // Input states
  const [language, setLanguage] = useState<SupportedDebuggerLanguage>('cpp');
  const [code, setCode] = useState<string>(DEBUGGER_EXAMPLES.cpp[0].code);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [explanationLanguage, setExplanationLanguage] = useState<'english' | 'hinglish'>('english');

  // Analysis & Trace states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTrace, setIsGeneratingTrace] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<GeminiDebugAnalysisResult | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // History state
  const [sessions, setSessions] = useState<StoredDebugSessionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Active view tab for player vs analysis vs side-by-side
  const [activeTab, setActiveTab] = useState<'player' | 'analysis'>('player');

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await debuggerService.listHistory();
      setSessions(res);
    } catch (err) {
      console.error('Failed to load debugger history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLanguageChange = (newLang: SupportedDebuggerLanguage) => {
    setLanguage(newLang);
    // Load default example if current code is an example
    const defaultExample = DEBUGGER_EXAMPLES[newLang]?.[0];
    if (defaultExample) {
      setCode(defaultExample.code);
    }
  };

  const handleLoadExample = () => {
    const list = DEBUGGER_EXAMPLES[language] || [];
    if (list.length > 0) {
      // Pick random or cycle
      const randomEx = list[Math.floor(Math.random() * list.length)];
      setCode(randomEx.code);
      showToast(`Loaded example: ${randomEx.title}`, 'info');
    }
  };

  const handleClearCode = () => {
    setCode('');
    setUserQuestion('');
    setActiveAnalysis(null);
    setActiveSessionId(null);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      showToast('Please paste or write code to analyze.', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await debuggerService.analyze({
        language,
        code,
        userQuestion: userQuestion.trim() ? userQuestion.trim() : undefined,
        explanationLanguage,
      });

      setActiveAnalysis(res.analysis);
      setActiveSessionId(res.sessionId);
      setActiveTab('player');
      showToast('Analysis and interactive dry-run ready!', 'success');
      loadHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerateDryRun = async () => {
    if (!code.trim()) return;
    try {
      setIsGeneratingTrace(true);
      const traceRes = await debuggerService.dryRun({
        language,
        code,
        sessionId: activeSessionId || undefined,
      });

      if (activeAnalysis) {
        setActiveAnalysis({
          ...activeAnalysis,
          dryRun: traceRes.dryRun,
          narrationEnglish: traceRes.narrationEnglish,
          narrationHinglish: traceRes.narrationHinglish,
        });
      }
      showToast('Refreshed dry-run trace.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to regenerate dry run.';
      showToast(msg, 'error');
    } finally {
      setIsGeneratingTrace(false);
    }
  };

  const handleSelectHistorySession = async (id: string) => {
    try {
      const full = await debuggerService.getSession(id);
      setActiveSessionId(full._id);
      setLanguage(full.language);
      setCode(full.originalCode);
      setActiveAnalysis({
        language: full.language,
        title: full.title,
        summary: full.explanation.summary,
        issues: full.issues,
        correctedCode: full.correctedCode,
        lineByLineExplanation: full.explanation.lineByLineExplanation,
        dryRun: full.dryRun,
        narrationEnglish: full.narrationEnglish,
        narrationHinglish: full.narrationHinglish,
        concepts: full.explanation.concepts,
        learningTips: full.explanation.learningTips,
      });
      setActiveTab('player');
      showToast(`Loaded: ${full.title}`, 'info');
    } catch (err) {
      console.error('Failed to load session:', err);
      showToast('Could not load the saved debug session.', 'error');
    }
  };

  const handleDeleteHistorySession = async (id: string) => {
    try {
      await debuggerService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
      showToast('Session removed.', 'info');
    } catch (err) {
      console.error('Failed to delete session:', err);
      showToast('Could not delete session.', 'error');
    }
  };

  const handleRenameHistorySession = async (id: string, newTitle: string) => {
    try {
      await debuggerService.renameSession(id, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, title: newTitle } : s))
      );
      if (activeSessionId === id && activeAnalysis) {
        setActiveAnalysis({ ...activeAnalysis, title: newTitle });
      }
    } catch (err) {
      console.error('Failed to rename session:', err);
      showToast('Could not rename session.', 'error');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          title="Code Debugger & Dry-Run Player"
          subtitle="Static analysis, instant bug resolution, and step-by-step interactive variable trace player powered by Gemini AI."
        />

        {/* Section 1: Code Input Area */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 sm:p-6 space-y-4">
          {/* Top Bar: Language Selector, Explanation Lang, Example buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-500" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedDebuggerLanguage)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cpp">C++ (GCC / Clang)</option>
                <option value="c">C (ANSI / C11)</option>
                <option value="python">Python 3.x</option>
                <option value="javascript">JavaScript (ES6+)</option>
                <option value="java">Java (JDK 17+)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Explanation Language Toggle */}
              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 bg-gray-50 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setExplanationLanguage('english')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    explanationLanguage === 'english'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  English Explanation
                </button>
                <button
                  type="button"
                  onClick={() => setExplanationLanguage('hinglish')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    explanationLanguage === 'hinglish'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  Hinglish Explanation
                </button>
              </div>

              <button
                type="button"
                onClick={handleLoadExample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Load Buggy Example
              </button>

              <button
                type="button"
                onClick={handleClearCode}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="relative rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Editor ({language})
              </span>
              <span>{code.split('\n').length} lines • {code.length} chars</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or type code here..."
              rows={12}
              className="w-full p-3.5 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-blue-600/40"
              spellCheck={false}
            />
          </div>

          {/* Optional User Question Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Optional Question or Specific Concern
            </label>
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="e.g. Why is it throwing an out-of-bounds error on the last element?"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Static analysis with 0 backend code execution — secure, fast, and sandboxed trace.</span>
            </div>

            <div className="flex items-center gap-2">
              {activeAnalysis && (
                <button
                  type="button"
                  onClick={handleRegenerateDryRun}
                  disabled={isGeneratingTrace || isAnalyzing}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingTrace ? 'animate-spin' : ''}`} />
                  {isGeneratingTrace ? 'Regenerating...' : 'Re-run Trace'}
                </button>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" /> Analyzing Code...
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4" /> Debug & Trace Execution
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Player & Results Area */}
        {activeAnalysis && (
          <div className="space-y-4">
            {/* Tab navigation between Dry-Run Player and Deep Analysis */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('player')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'player'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" /> Interactive Dry-Run Player
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {activeAnalysis.dryRun?.length || 0} steps
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'analysis'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Issues & Solutions
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
                    {activeAnalysis.issues?.length || 0}
                  </span>
                </button>
              </div>

              <div className="text-xs font-medium text-gray-500 dark:text-slate-400 hidden sm:block">
                Session: <span className="font-semibold text-gray-800 dark:text-slate-200">{activeAnalysis.title}</span>
              </div>
            </div>

            {/* Tab 1: Interactive Dry Run Player */}
            {activeTab === 'player' && (
              <div className="space-y-4">
                <DryRunPlayer
                  code={code}
                  language={language}
                  steps={activeAnalysis.dryRun}
                  narrationEnglish={activeAnalysis.narrationEnglish}
                  narrationHinglish={activeAnalysis.narrationHinglish}
                  initialLanguage={explanationLanguage}
                />
              </div>
            )}

            {/* Tab 2: Detailed Static Analysis, Issues & Corrected Code */}
            {activeTab === 'analysis' && (
              <div>
                <AnalysisResults
                  summary={activeAnalysis.summary}
                  issues={activeAnalysis.issues}
                  correctedCode={activeAnalysis.correctedCode}
                  lineByLineExplanation={activeAnalysis.lineByLineExplanation}
                  concepts={activeAnalysis.concepts}
                  learningTips={activeAnalysis.learningTips}
                  language={language}
                  code={code}
                  onApplyCorrectedCode={(newCode) => {
                    setCode(newCode);
                    showToast('Corrected code loaded into editor.', 'success');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Section 3: User's Debugging History */}
        <div className="pt-4">
          <DebugHistory
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectHistorySession}
            onDeleteSession={handleDeleteHistorySession}
            onRenameSession={handleRenameHistorySession}
            isLoading={historyLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
