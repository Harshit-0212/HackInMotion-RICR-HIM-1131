import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type {
  CodeIssue,
  LineByLineExplanation,
  IssueSeverity,
  SupportedDebuggerLanguage,
  ExplainCodeResult,
} from '@/types/debugger';
import { debuggerService } from '@/services/debuggerService';

interface AnalysisResultsProps {
  summary: string;
  issues: CodeIssue[];
  correctedCode: string;
  lineByLineExplanation: LineByLineExplanation[];
  concepts: string[];
  learningTips: string[];
  language: SupportedDebuggerLanguage;
  code: string;
  onLineClick?: (line: number) => void;
  onApplyCorrectedCode?: (newCode: string) => void;
}

export function AnalysisResults({
  summary,
  issues,
  correctedCode,
  lineByLineExplanation,
  concepts,
  learningTips,
  language,
  code,
  onLineClick,
  onApplyCorrectedCode,
}: AnalysisResultsProps) {
  const [copied, setCopied] = useState(false);
  const [expandedIssueIdx, setExpandedIssueIdx] = useState<number | null>(0);
  const [explainingLine, setExplainingLine] = useState<number | null>(null);
  const [activeExplainResult, setActiveExplainResult] = useState<{
    target: string;
    result: ExplainCodeResult;
  } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(correctedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExplainConceptOrError = async (
    targetLabel: string,
    params: { line?: number; error?: string; concept?: string }
  ) => {
    setIsExplaining(true);
    try {
      const res = await debuggerService.explain({
        language,
        code,
        ...params,
      });
      setActiveExplainResult({ target: targetLabel, result: res });
    } catch (err) {
      console.error('Failed to get deep explanation:', err);
    } finally {
      setIsExplaining(false);
      setExplainingLine(null);
    }
  };

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-600" /> Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-600" /> Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Code Summary Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Analysis Overview
          </h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
          {summary}
        </p>
      </div>

      {/* Deep Concept/Error Modal or Card if active */}
      {activeExplainResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-blue-50/50 dark:from-indigo-950/30 dark:to-slate-900/60 border border-indigo-200 dark:border-indigo-900 shadow-sm relative">
          <button
            type="button"
            onClick={() => setActiveExplainResult(null)}
            className="absolute top-3 right-3 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
          >
            Close
          </button>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Cadence Deep Dive: {activeExplainResult.target}
            </h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
            {activeExplainResult.result.explanation}
          </p>

          {activeExplainResult.result.keyTakeaways?.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1.5">
                Key Takeaways:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 dark:text-slate-300">
                {activeExplainResult.result.keyTakeaways.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {activeExplainResult.result.exampleSnippet && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
                Suggested Pattern:
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto">
                {activeExplainResult.result.exampleSnippet}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Issues Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Detected Issues ({issues.length})
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Click an issue for fix details
          </span>
        </div>

        {issues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
              No issues detected! Your code appears clean and syntactically sound.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {issues.map((issue, idx) => {
              const isExpanded = expandedIssueIdx === idx;
              return (
                <div key={idx} className="p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                  <div
                    onClick={() => setExpandedIssueIdx(isExpanded ? null : idx)}
                    className="flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {getSeverityBadge(issue.severity)}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        Line {issue.line}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {issue.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {issue.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExplainConceptOrError(`Line ${issue.line}: ${issue.message}`, {
                            line: issue.line,
                            error: issue.message,
                          });
                        }}
                        disabled={isExplaining}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900"
                      >
                        Explain Line
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-2 sm:pl-4 border-l-2 border-blue-500 space-y-3 pt-2 text-xs">
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-slate-300 block mb-1">
                          Why this happens:
                        </span>
                        <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-sans">
                          {issue.why}
                        </p>
                      </div>

                      {issue.snippet && (
                        <div>
                          <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                            Offending code snippet:
                          </span>
                          <pre className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-mono text-[11px] border border-rose-200 dark:border-rose-900 overflow-x-auto">
                            {issue.snippet}
                          </pre>
                        </div>
                      )}

                      <div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Recommended fix:
                        </span>
                        <p className="text-gray-700 dark:text-slate-300 mb-2 font-sans">
                          {issue.fix}
                        </p>
                        {issue.correctedSnippet && (
                          <pre className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-mono text-[11px] border border-emerald-200 dark:border-emerald-900 overflow-x-auto">
                            {issue.correctedSnippet}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Corrected Code Card */}
      {correctedCode && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Corrected Implementation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {onApplyCorrectedCode && (
                <button
                  type="button"
                  onClick={() => onApplyCorrectedCode(correctedCode)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  Load into Editor
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed max-h-[360px]">
            {correctedCode}
          </pre>
        </div>
      )}

      {/* Line-by-Line Breakdown & Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Line-by-Line Breakdown */}
        <div className="md:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Line-by-Line Guide
          </h4>
          <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
            {lineByLineExplanation.map((item, i) => (
              <div
                key={i}
                onClick={() => onLineClick?.(item.line)}
                className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/60 dark:border-slate-800 flex items-start gap-3 cursor-pointer text-xs"
              >
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  L{item.line}
                </span>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Concepts and Learning Tips */}
        <div className="md:col-span-5 space-y-4">
          {/* Concepts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Core Concepts
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {concepts.map((concept, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleExplainConceptOrError(concept, {
                      concept,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                >
                  {concept} ↗
                </button>
              ))}
            </div>
          </div>

          {/* Learning Tips */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Pro Tips
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-slate-300 list-disc list-inside">
              {learningTips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

