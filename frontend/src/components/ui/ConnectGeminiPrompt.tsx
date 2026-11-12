import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ConnectGeminiPrompt({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Connect your Gemini API Key
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              To use <span className="font-semibold text-indigo-600 dark:text-indigo-400">{feature}</span>, connect your own Google Gemini API key. Your key is securely encrypted at rest and used solely for your personal AI requests.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-knowledge client storage &bull; Masked previews only</span>
            </div>
          </div>
        </div>

        <Link
          to="/app/settings#ai-settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors shrink-0"
        >
          <span>Connect Key</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
