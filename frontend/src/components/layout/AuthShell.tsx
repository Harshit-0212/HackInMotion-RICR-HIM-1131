import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Brain, Trophy, Flame, Target, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export type AuthState = 'idle' | 'email-typing' | 'password-focus' | 'submitting' | 'success' | 'error';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  authState = 'idle',
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  authState?: AuthState;
}) {
  const location = useLocation();

  // Cursor following glow (Desktop only)
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSpringX = useSpring(cursorX, { stiffness: 90, damping: 24 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 120);
      cursorY.set(e.clientY - 120);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [cursorX, cursorY]);

  // 3D Perspective Tilt for Login Card
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const tiltX = useTransform(cardY, [-300, 300], [3, -3]);
  const tiltY = useTransform(cardX, [-300, 300], [-3, 3]);
  const cardRotateX = useSpring(tiltX, { stiffness: 120, damping: 20 });
  const cardRotateY = useSpring(tiltY, { stiffness: 120, damping: 20 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    cardX.set(e.clientX - rect.left - width / 2);
    cardY.set(e.clientY - rect.top - height / 2);
  };

  const handleCardMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-screen w-full overflow-hidden bg-ink-950 text-ink-100 select-none"
    >
      {/* 1. Dynamic Background layers */}
      <div className="absolute inset-0 -z-20 bg-ink-975" />

      {/* Slowly moving gradient meshes */}
      <div
        className="absolute inset-0 opacity-[0.25] blur-[120px] pointer-events-none -z-10"
        style={{
          background: `
            radial-gradient(at 10% 20%, rgba(99, 102, 241, 0.4) 0px, transparent 50%),
            radial-gradient(at 90% 80%, rgba(139, 92, 246, 0.3) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(34, 211, 238, 0.25) 0px, transparent 50%)
          `,
        }}
      />

      {/* Custom Particle background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <BackgroundParticles />
      </div>

      {/* Cursor tracking glow orb (Desktop only) */}
      <motion.div
        style={{ x: cursorSpringX, y: cursorSpringY }}
        className="pointer-events-none absolute h-60 w-60 rounded-full bg-gradient-to-br from-[#6542C5]/10 to-accent-500/10 blur-[80px] -z-10 hidden lg:block"
      />

      {/* Main Composition */}
      <div className="mx-auto flex w-full max-w-7xl flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-center px-6 py-12 lg:px-8">
        {/* Left Side: Animated Learning Visualization */}
        <div className="relative w-full lg:col-span-6 flex flex-col items-center lg:items-start justify-center min-h-[380px] lg:min-h-[500px]">
          {/* Subtle branding title */}
          <div className="absolute top-0 left-0 hidden lg:block">
            <Logo to="/" size="lg" />
            <span className="mt-3 block text-[9.5px] font-bold tracking-[0.25em] text-[#B59AF7] uppercase">
              YOUR LEARNING, REIMAGINED.
            </span>
          </div>

          <div className="w-full flex flex-col items-center justify-center mt-12 lg:mt-0">
            {/* Visual core */}
            <VisualAICore authState={authState} />

            {/* Micro floating info widgets */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 max-w-md">
              <FloatingWidget label="12 concepts mastered" icon={Brain} delay={0.2} />
              <FloatingWidget label="7 day streak" icon={Flame} delay={0.4} />
              <FloatingWidget label="82% retention" icon={TrendingUp} delay={0.6} />
              <FloatingWidget label="AI Coach: Ready" icon={Sparkles} delay={0.8} />
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="w-full lg:col-span-6 flex justify-center">
          <motion.div
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{ rotateX: cardRotateX, rotateY: cardRotateY, transformStyle: 'preserve-3d' }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/60 p-6 sm:p-8 backdrop-blur-2xl shadow-lift transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
          >
            {/* Mobile-only logo */}
            <div className="mb-6 flex justify-center lg:hidden">
              <Logo size="md" />
            </div>

            {/* AI Assistant Banner */}
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  {/* Pulsing AI status indicator */}
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      authState === 'submitting'
                        ? 'bg-[#B59AF7]'
                        : authState === 'success'
                          ? 'bg-emerald-400'
                          : authState === 'error'
                            ? 'bg-error-400'
                            : 'bg-accent-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      authState === 'submitting'
                        ? 'bg-[#6542C5]'
                        : authState === 'success'
                          ? 'bg-emerald-500'
                          : authState === 'error'
                            ? 'bg-error-500'
                            : 'bg-accent-500'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-ink-300 uppercase">Nova AI session</span>
              </div>
              <span className="text-[10.5px] font-semibold text-[#B59AF7]">
                {authState === 'idle' && 'Your learning environment is ready.'}
                {authState === 'email-typing' && 'Syncing account profile...'}
                {authState === 'password-focus' && 'Verifying keys...'}
                {authState === 'submitting' && 'Securing session authorization...'}
                {authState === 'success' && 'Learning profile loaded!'}
                {authState === 'error' && 'Verification failed.'}
              </span>
            </div>

            {/* Render form using location as transition trigger */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -15, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
                <p className="mt-1 text-xs text-ink-400">{subtitle}</p>

                <div className="mt-6">{children}</div>
              </motion.div>
            </AnimatePresence>

            {footer && (
              <div className="mt-6 text-center text-xs text-ink-400 border-t border-white/5 pt-4">{footer}</div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function AuthSwitchLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="font-bold text-[#B59AF7] hover:text-[#B59AF7] transition-colors duration-200">
      {label}
    </Link>
  );
}

/* ============================================================================
   SUB-COMPONENT: Floating Widget
   ============================================================================ */
function FloatingWidget({ label, icon: Icon, delay }: { label: string; icon: any; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -3, scale: 1.03 }}
      className="flex items-center gap-2 rounded-xl border border-white/5 bg-ink-900/40 px-3 py-1.5 backdrop-blur-md shadow-card pointer-events-auto"
    >
      <Icon size={12} className="text-[#B59AF7]" />
      <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Dynamic AI Visual Core
   ============================================================================ */
function VisualAICore({ authState }: { authState: AuthState }) {
  // Speed and scale states determined by authState
  const spinSpeed =
    authState === 'submitting'
      ? 'animate-[spin_1.5s_linear_infinite]'
      : authState === 'email-typing'
        ? 'animate-[spin_4s_linear_infinite]'
        : 'animate-[spin_9s_linear_infinite]';
  const spinSpeedRev =
    authState === 'submitting'
      ? 'animate-[spin_1.5s_linear_infinite_reverse]'
      : authState === 'email-typing'
        ? 'animate-[spin_4s_linear_infinite_reverse]'
        : 'animate-[spin_9s_linear_infinite_reverse]';

  const topics = [
    { name: 'Dynamic Programming', x: -110, y: -70, color: 'border-coral-400/20 text-coral-300' },
    { name: 'Graph Algorithms', x: 120, y: -60, color: 'border-[#B59AF7]/20 text-[#B59AF7]' },
    { name: 'Probability & Stats', x: -115, y: 70, color: 'border-accent-400/20 text-accent-300' },
    { name: 'Arrays & Sorting', x: 110, y: 65, color: 'border-emerald-400/20 text-emerald-300' },
  ];

  return (
    <div className="relative flex h-[280px] w-[280px] items-center justify-center select-none pointer-events-none md:h-[320px] md:w-[320px]">
      {/* Dynamic ambient background aura */}
      <motion.div
        animate={{
          scale: authState === 'submitting' ? [1.1, 1.25, 1.1] : authState === 'password-focus' ? 1.15 : 1,
          opacity:
            authState === 'submitting' ? 0.35 : authState === 'success' ? 0.45 : authState === 'error' ? 0.4 : 0.25,
        }}
        className={`absolute h-48 w-48 rounded-full blur-3xl transition-all duration-500 -z-10 ${
          authState === 'success' ? 'bg-emerald-500' : authState === 'error' ? 'bg-error-500' : 'bg-[#6542C5]'
        }`}
      />

      {/* SVG Core rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className={`absolute h-[220px] w-[220px] opacity-25 ${spinSpeed}`} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#22D3EE" strokeWidth="0.8" strokeDasharray="6 8" />
        </svg>
        <svg className={`absolute h-[180px] w-[180px] opacity-20 ${spinSpeedRev}`} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 14" />
        </svg>
      </div>

      {/* Glowing Orb Protagonist */}
      <motion.div
        animate={{
          scale: authState === 'submitting' ? [1, 1.12, 1] : 1,
          boxShadow:
            authState === 'success'
              ? '0 0 45px rgba(52, 211, 153, 0.6)'
              : authState === 'error'
                ? '0 0 35px rgba(239, 68, 68, 0.5)'
                : '0 0 35px rgba(99,102,241,0.35)',
        }}
        transition={{ duration: 1.5, repeat: authState === 'submitting' ? Infinity : 0 }}
        className={`relative z-20 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-ink-950/70 p-2 backdrop-blur-md transition-colors duration-500 ${
          authState === 'success'
            ? 'border-emerald-400/40 text-emerald-300'
            : authState === 'error'
              ? 'border-error-400/40 text-error-400'
              : 'border-white/20 text-white'
        }`}
      >
        <motion.div
          animate={{
            rotate: authState === 'submitting' ? 360 : 0,
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br transition-all duration-500 ${
            authState === 'success'
              ? 'from-aurora-500 to-green-600'
              : authState === 'error'
                ? 'from-error-500 to-pink-600'
                : authState === 'password-focus'
                  ? 'from-accent-500 via-violet-500 to-[#6542C5]'
                  : 'from-[#6542C5] via-violet-500 to-accent-400'
          }`}
        >
          {authState === 'success' ? (
            <CheckCircle2 size={32} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
          ) : authState === 'error' ? (
            <AlertCircle size={32} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
          ) : (
            <Brain size={28} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
          )}
        </motion.div>
      </motion.div>

      {/* Floating dynamic learning nodes */}
      {topics.map((topic, index) => {
        // Compute positions with dynamic float offset
        const floatDelay = index * 0.8;
        const rotateOffset = index * 90;

        return (
          <motion.div
            key={index}
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 4.5 + index * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: floatDelay,
            }}
            style={{ x: topic.x, y: topic.y }}
            className={`absolute z-30 rounded-xl border bg-ink-950/85 px-3 py-1.5 text-[9.5px] font-bold backdrop-blur-md shadow-card leading-none transition-all duration-300 ${topic.color} ${
              authState === 'email-typing' && 'scale-[1.04] border-[#6542C5]/30'
            }`}
          >
            {topic.name}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Slow Moving Background Stars Canvas
   ============================================================================ */
function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: { x: number; y: number; r: number; o: number; vo: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(30, Math.floor((canvas.width * canvas.height) / 55000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.5,
        o: Math.random() * 0.4 + 0.1,
        vo: (Math.random() - 0.5) * 0.005,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6366F1';

      particles.forEach((p) => {
        p.o += p.vo;
        if (p.o <= 0.05 || p.o >= 0.5) p.vo *= -1;
        ctx.globalAlpha = p.o;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
