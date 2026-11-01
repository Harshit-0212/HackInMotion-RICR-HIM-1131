import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthShell, AuthSwitchLink } from '@/components/layout/AuthShell';
import { Input } from '@/components/ui/Input';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { User } from '@/types';

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

export function Signup() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom interaction states
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [success, setSuccess] = useState(false);

  const pwStrength = useMemo(() => strength(password), [password]);
  const matchError = confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (confirm !== password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup({ name, email, password });
      setSuccess(true);
      showToast('Account created. Welcome to Cadence!');
      setTimeout(() => {
        navigate('/app');
      }, 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (loggedInUser: User) => {
    setError(null);
    setSuccess(true);
    showToast(`Welcome, ${loggedInUser.name.split(' ')[0]}!`);
    setTimeout(() => navigate('/app'), 150);
  };

  const handleGoogleError = (message: string) => {
    setError(message);
  };

  // Compute overall authentication state for visual protagonist (AI Core)
  let authState: 'idle' | 'email-typing' | 'password-focus' | 'submitting' | 'success' | 'error' = 'idle';
  if (success) {
    authState = 'success';
  } else if (loading) {
    authState = 'submitting';
  } else if (error) {
    authState = 'error';
  } else if (passwordFocused) {
    authState = 'password-focus';
  } else if (email.length > 0 || name.length > 0) {
    authState = 'email-typing';
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building your personalized study plan in minutes."
      authState={authState}
      footer={
        <>
          Already have an account? <AuthSwitchLink to="/login" label="Sign in" />
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Harshit Dubey"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<UserIcon size={16} />}
          premium
          required
        />

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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            leftIcon={<Lock size={16} />}
            premium
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
            required
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
          label="Confirm password"
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
          className="relative w-full h-11 rounded-xl bg-gradient-to-r from-primary-500 via-violet-500 to-accent-500 text-sm font-bold text-white overflow-hidden shadow-glow flex items-center justify-center gap-1.5 transition-all duration-300 disabled:opacity-50"
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
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
            </span>
          ) : success ? (
            <span className="flex items-center gap-1.5">✓ Preparing your environment...</span>
          ) : (
            <>
              <span>Create Account</span>
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                →
              </motion.span>
            </>
          )}
        </motion.button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
        <span className="h-px flex-1 bg-white/5" />
        OR CONTINUE WITH
        <span className="h-px flex-1 bg-white/5" />
      </div>

      <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

      <p className="mt-4 text-center text-[10px] text-ink-500 leading-relaxed">
        By signing up you agree to our{' '}
        <Link to="#" className="underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="#" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
