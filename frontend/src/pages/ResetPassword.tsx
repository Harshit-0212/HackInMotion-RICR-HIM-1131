import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthShell, AuthSwitchLink } from '@/components/layout/AuthShell';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/store/ToastContext';
import { authService } from '@/services/authService';

function strength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-error-500', 'bg-error-500', 'bg-warning-500', 'bg-accent-500', 'bg-success-500'];
  return { score, label: labels[score], color: colors[score] };
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pwStrength = useMemo(() => strength(password), [password]);
  const matchError = confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined;

  useEffect(() => {
    if (!token) {
      setCheckingToken(false);
      setTokenValid(false);
      return;
    }
    authService.verifyResetToken(token).then((valid) => {
      setTokenValid(valid);
      setCheckingToken(false);
    });
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (confirm !== password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      showToast('Password updated. Sign in with your new password.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  let authState: 'idle' | 'password-focus' | 'submitting' | 'success' | 'error' = 'idle';
  if (success) {
    authState = 'success';
  } else if (loading) {
    authState = 'submitting';
  } else if (error || (!checkingToken && !tokenValid)) {
    authState = 'error';
  } else if (password.length > 0) {
    authState = 'password-focus';
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      authState={authState}
      footer={
        <>
          Remembered it? <AuthSwitchLink to="/login" label="Back to sign in" />
        </>
      }
    >
      {checkingToken ? (
        <div className="flex items-center justify-center py-8">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#B59AF7] animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-[#B59AF7] animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="h-2 w-2 rounded-full bg-[#B59AF7] animate-bounce" style={{ animationDelay: '0.3s' }} />
          </span>
        </div>
      ) : !tokenValid ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-error-500/20 bg-error-500/5 p-6 text-center backdrop-blur-md"
        >
          <AlertCircle size={36} className="mx-auto text-error-400" />
          <h3 className="mt-3 font-display text-lg font-bold text-white">Link invalid or expired</h3>
          <p className="mt-2 text-xs text-ink-300 leading-relaxed">
            This password reset link is no longer valid. Request a new one to continue.
          </p>
          <Link to="/forgot-password" className="mt-6 inline-block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <ArrowLeft size={14} /> Request a new link
            </motion.button>
          </Link>
        </motion.div>
      ) : success ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[#6542C5]/20 bg-[#6542C5]/5 p-6 text-center backdrop-blur-md"
        >
          <CheckCircle2 size={36} className="mx-auto text-[#B59AF7] animate-pulse" />
          <h3 className="mt-3 font-display text-lg font-bold text-white">Password updated</h3>
          <p className="mt-2 text-xs text-ink-300 leading-relaxed">Redirecting you to sign in...</p>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              premium
              required
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            {password.length > 0 && (
              <div className="mt-2 px-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < pwStrength.score ? pwStrength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-bold tracking-wide text-ink-400 uppercase">{pwStrength.label}</p>
              </div>
            )}
          </div>

          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            name="confirm"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            leftIcon={<Lock size={16} />}
            error={matchError}
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
              <span>Reset Password</span>
            )}
          </motion.button>
        </form>
      )}
    </AuthShell>
  );
}
