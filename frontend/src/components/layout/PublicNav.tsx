import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';
import { scrollToElement } from '@/hooks/useLenis';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Curriculum', href: '#features' },
  { label: 'Comprehension', href: '#personalization' },
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
    const onScroll = () => setScrolled(window.scrollY > 20);
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
    ? 'border-b border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2]/95 dark:bg-[#1D1922]/95 backdrop-blur-md shadow-xs'
    : 'bg-transparent border-b border-transparent';

  return (
    <>
      <header className={`fixed top-0 z-50 w-full transition-all duration-200 py-3 ${headerClass}`}>
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
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors rounded-none ${
                    isActive
                      ? 'text-[#6542C5] dark:text-[#B59AF7]'
                      : 'text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/50 text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white rounded-none transition-colors"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            <Link to="/login" className="hidden sm:inline-block">
              <span className="px-3 py-1.5 text-xs font-semibold text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white transition-colors">
                Log In
              </span>
            </Link>

            <Link to="/signup">
              <button className="btn-render-sweep inline-flex h-8 items-center justify-center bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] hover:text-white dark:hover:text-[#141217] px-3.5 text-xs font-bold border border-[#51329F] dark:border-[#B59AF7]/40 shadow-xs rounded-none">
                <span className="relative z-10">Get Started</span>
              </button>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 text-[#5F5668] dark:text-[#B8AFBE] md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#FBF8F2] dark:bg-[#1D1922] pt-20 px-6 space-y-4 md:hidden border-b border-[#D8D0C5] dark:border-white/10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className="block w-full text-left py-2 text-sm font-semibold text-[#211D28] dark:text-[#F5F0E8]"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-[#D8D0C5] dark:border-white/10 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2 text-xs font-semibold">
              Log In
            </Link>
            <Link to="/signup" onClick={() => setMobileOpen(false)}>
              <button className="btn-render-sweep w-full h-9 bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] text-xs font-bold rounded-none">
                <span className="relative z-10">Get Started</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
