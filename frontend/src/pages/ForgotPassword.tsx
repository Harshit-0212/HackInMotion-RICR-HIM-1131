import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthShell, AuthSwitchLink } from '@/components/layout/AuthShell';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { devResetUrl: link } = await authService.forgotPassword(email);
      setDevResetUrl(link ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!devResetUrl) return;
    await navigator.clipboard.writeText(devResetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute overall authentication state for visual protagonist (AI Core)
  let authState: 'idle' | 'email-typing' | 'password-focus' | 'submitting' | 'success' | 'error' = 'idle';
  if (sent) {
    authState = 'success';
  } else if (loading) {
    authState = 'submitting';
  } else if (error) {
    authState = 'error';
  } else if (email.length > 0) {
    authState = 'email-typing';
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      authState={authState}
      footer={
        <>
          Remembered it? <AuthSwitchLink to="/login" label="Back to sign in" />
        </>
      }
    >
      {sent ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[#6542C5]/20 bg-[#6542C5]/5 p-6 text-center backdrop-blur-md"
        >
          <CheckCircle2 size={36} className="mx-auto text-[#B59AF7] animate-pulse" />
          <h3 className="mt-3 font-display text-lg font-bold text-white">Check your inbox</h3>
          <p className="mt-2 text-xs text-ink-300 leading-relaxed">
            If an account exists for <span className="font-semibold text-[#B59AF7]">{email}</span>, a reset link is on
            its way.
          </p>

          {devResetUrl && (
            <div className="mt-4 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-warning-400">
                Email delivery isn't configured yet — dev-only link
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={devResetUrl}
                  className="flex-1 truncate text-xs font-medium text-[#B59AF7] underline underline-offset-2 hover:text-primary-200"
                >
                  {devResetUrl}
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy reset link"
                  className="shrink-0 rounded-lg p-1.5 text-ink-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Copy size={14} />
                </button>
              </div>
              {copied && <p className="mt-1 text-[10px] font-semibold text-[#B59AF7]">Copied!</p>}
            </div>
          )}

          <Link to="/login" className="mt-6 inline-block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <ArrowLeft size={14} /> Back to sign in
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            premium
            required
          />

          {error && (
            <motion.div
              initial={{ x: -6 }}
              animate={{ x: [0, -8, 8, -6, 6, 0] }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-xs font-semibold text-error-400 flex items-center gap-2"
            >
              <AlertCircle size={14} className="text-error-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="relative w-full h-11 rounded-xl bg-gradient-to-r from-[#6542C5] via-violet-500 to-accent-500 text-sm font-bold text-white overflow-hidden shadow-glow flex items-center justify-center gap-1.5 transition-all duration-300 disabled:opacity-50"
          >
            {/* Shine Sweep Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />

            {loading ? (
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  →
                </motion.span>
              </>
            )}
          </motion.button>
        </form>
      )}
    </AuthShell>
  );
}
