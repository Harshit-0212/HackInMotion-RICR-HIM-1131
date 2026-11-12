import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';
import { scrollToElement } from '@/hooks/useLenis';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'AI Planner', href: '#personalization' },
  { label: 'Progress', href: '#progress' },
];

export function PublicNav() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const onLanding = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!onLanding) return;
    const sections = NAV_ITEMS.map((item) => document.querySelector(item.href)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveHref(`#${visible.target.id}`);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onLanding]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    setActiveHref(href);
    scrollToElement(href);
  };

  const headerClass = scrolled
    ? isDark
      ? 'border-b border-white/10 bg-[#141217]/90 py-2 shadow-lg shadow-black/30 backdrop-blur-xl'
      : 'bg-[#FBF8F2]/90 border-b border-[#D8D0C5] py-2 shadow-sm backdrop-blur-xl'
    : 'bg-transparent py-4';

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${headerClass}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo to="/" size="sm" />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`group relative px-3 py-2 text-sm font-medium transition ${
                    isDark ? 'text-[#B8AFBE] hover:text-white' : 'text-[#5F5668] hover:text-[#211D28]'
                  }`}
                >
                  {item.label}
                  <motion.span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#6542C5] via-[#9B72F5] to-[#F2B38C]"
                    initial={false}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                  />
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#6542C5]/50 via-[#9B72F5]/50 to-[#F2B38C]/50 transition-transform duration-300 group-hover:scale-x-100" />
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`rounded-lg p-2 transition ${
                isDark
                  ? 'text-[#B8AFBE] hover:bg-white/10 hover:text-white'
                  : 'text-[#5F5668] hover:bg-[#E8E1D7] hover:text-[#211D28]'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {!onLanding && (
              <Link to="/login" className="hidden sm:block">
                <span
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isDark ? 'text-[#D8D0C5] hover:text-white' : 'text-[#5F5668] hover:text-[#211D28]'
                  }`}
                >
                  Log in
                </span>
              </Link>
            )}

            <Link to="/signup">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex items-center gap-1.5 rounded-xl bg-[#6542C5] dark:bg-[#B59AF7] px-4 py-2 text-sm font-semibold text-white dark:text-[#141217] shadow-sm hover:opacity-95"
              >
                Get Started
              </motion.span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`rounded-lg p-2 transition ${
                isDark
                  ? 'text-[#B8AFBE] hover:bg-white/10 hover:text-white'
                  : 'text-[#5F5668] hover:bg-[#E8E1D7] hover:text-[#211D28]'
              } md:hidden`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-16 z-40 w-full px-4 py-4 md:hidden border-b ${
              isDark ? 'bg-[#1D1922] border-white/10 shadow-lg' : 'bg-[#FBF8F2] border-[#D8D0C5] shadow-sm'
            }`}
          >
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                    isDark
                      ? 'text-[#D8D0C5] hover:bg-white/10 hover:text-white'
                      : 'text-[#211D28] hover:bg-[#E8E1D7] hover:text-[#211D28]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {!onLanding && (
                <Link
                  to="/login"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isDark ? 'text-[#D8D0C5] hover:text-white' : 'text-[#211D28] hover:text-[#211D28]'
                  }`}
                >
                  Log in
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
