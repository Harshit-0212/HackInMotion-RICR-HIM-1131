import React, { useState } from 'react';
import { Target, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { resumeService } from '../../services/resumeService';

interface AtsScoreCardProps {
  resumeId?: string;
  targetRole?: string;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({ resumeId, targetRole }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckScore() {
    if (!resumeId) {
      setError('Please save your resume first before running the ATS audit.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await resumeService.getAtsScore(resumeId, targetRole);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to check ATS score.');
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400 border-amber-500';
    return 'text-rose-600 dark:text-rose-400 border-rose-500';
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Target size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AI ATS Readiness & Parser Audit</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Evaluates keyword gaps, impact metrics & recruiter readability</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckScore}
          disabled={loading || !resumeId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-zinc-900 text-xs font-semibold rounded-lg shadow-xs hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Auditing...
            </>
          ) : (
            <>
              <Sparkles size={12} /> Audit ATS Score
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center font-bold ${scoreColor(result.score)}`}>
              <span className="text-lg leading-none">{result.score}</span>
              <span className="text-[9px] uppercase font-normal">Grade {result.grade}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{result.summary}</p>
            </div>
          </div>

          {result.suggestions && result.suggestions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Key Recommendations</p>
              <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                {result.suggestions.slice(0, 3).map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ArrowRight size={12} className="text-[#6542C5] shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.keywordGaps && result.keywordGaps.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Recommended ATS Keywords to Add</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywordGaps.map((kw: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium">
                    +{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

