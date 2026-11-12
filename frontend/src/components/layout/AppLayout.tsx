import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Sparkles,
  LineChart,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Bell,
  Search,
  FileText,
  Users,
  Code2,
  Code,
  ShieldAlert,
  Compass,
  GraduationCap,
  ChevronDown,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useNotifications } from '@/store/NotificationContext';
import { userApiKeyService, type UserApiKeyStatus } from '@/services/userApiKeyService';

export interface AppLayoutProps {
  children: ReactNode;
  focusMode?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  badge?: string;
  desc?: string;
}

interface NavGroupDef {
  label: string;
  items: NavItem[];
}

export function AppLayout({ children, focusMode = false }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Gemini API Key connection status
  const [geminiStatus, setGeminiStatus] = useState<UserApiKeyStatus | null>(null);

  // Modals & flyouts
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    userApiKeyService
      .getGeminiStatus()
      .then((s) => {
        if (mounted) setGeminiStatus(s);
      })
      .catch(() => {
        if (mounted) setGeminiStatus({ connected: false });
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  // Navigation Group Structure
  const learnItems: NavItem[] = [
    { to: '/app/journey', label: 'Learning Journey', icon: Compass, desc: 'Interactive visual curriculum map', badge: 'Map' },
    { to: '/app/plan', label: 'My Learning', icon: BookOpen, desc: 'Personalized study schedule & milestones' },
  ];

  const practiceItems: NavItem[] = [
    { to: '/app/coding', label: 'Coding Practice', icon: Code, desc: 'Live algorithmic sandbox & challenges' },
    { to: '/app/assessments', label: 'Practice & Quizzes', icon: Target, desc: 'Concept assessments & drills' },
    { to: '/app/comprehension', label: 'Code Comprehension', icon: GraduationCap, desc: 'Code reading & tracing drills' },
  ];

  const toolsItems: NavItem[] = [
    { to: '/app/tutor', label: 'AI Tutor', icon: Sparkles, desc: '24/7 personal conversational mentor' },
    { to: '/app/debugger', label: 'Code Debugger', icon: Code2, desc: 'Static analysis & dry-run player' },
    { to: '/app/groups', label: 'Study Groups', icon: Users, desc: 'Collaborative rooms & peer study' },
    { to: '/app/resume', label: 'Resume Maker', icon: FileText, desc: 'ATS-optimized resume generator' },
  ];

  const allSearchable: NavItem[] = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard },
    ...learnItems,
    ...practiceItems,
    ...toolsItems,
    { to: '/app/progress', label: 'Progress & Stats', icon: LineChart },
    { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/app/profile', label: 'Profile & Help', icon: HelpCircle },
    ...(user?.role === 'admin'
      ? [{ to: '/app/admin/coding', label: 'Question Studio (Admin)', icon: ShieldAlert }]
      : []),
  ];

  const searchResults = searchQuery.trim()
    ? allSearchable.filter((p) => p.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allSearchable;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setActiveDropdown(null);
        return;
      }

      // Check if user pressed '/' to open search
      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
        const isEditable =
          target?.isContentEditable ||
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target?.closest('.monaco-editor') ||
          target?.closest('[contenteditable="true"]');

        if (!isEditable) {
          e.preventDefault();
          openSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    setActiveDropdown(null);
    setSearchQuery('');
  }, [location.pathname]);

  const openSearch = () => {
    setSearchOpen(true);
    setNotifOpen(false);
    setProfileOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 120);
  };

  const toggleDropdown = (key: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  function timeAgo(iso: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const isLearnActive = learnItems.some((item) => location.pathname.startsWith(item.to));
  const isPracticeActive = practiceItems.some((item) => location.pathname.startsWith(item.to));
  const isToolsActive = toolsItems.some((item) => location.pathname.startsWith(item.to));

  // ─── Scroll-Transforming Header (Centered Compact Dock) ───────────
  const { scrollY } = useScroll();
  // Transition between 40px (start) and 120px (fully docked)
  const dockProgress = useTransform(scrollY, [40, 120], [0, 1]);
  // Outer containers smoothly slide inward toward the center
  const leftX = useTransform(scrollY, [40, 120], [0, 48]);
  const rightX = useTransform(scrollY, [40, 120], [0, -48]);
  const dockMaxWidth = useTransform(scrollY, [40, 120], ['100%', '88%']);
  const dockShadow = useTransform(
    scrollY,
    [40, 120],
    ['0 1px 2px 0 rgba(0, 0, 0, 0.05)', '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)']
  );

  return (
    <div className="min-h-screen bg-[#F1EDE6] text-[#211D28] dark:bg-[#141217] dark:text-[#F5F0E8] transition-colors duration-200 flex flex-col">
      {/* ============================================================
          TOP NAVIGATION BAR (Centered Compact Dock on scroll)
          ============================================================ */}
      {!focusMode && (
        <header className="sticky top-0 z-40 h-16 w-full flex items-center justify-center pointer-events-none px-3 sm:px-6">
          <motion.div
            style={{
              maxWidth: dockMaxWidth,
              boxShadow: dockShadow,
            }}
            className="w-full h-14 max-w-7xl mx-auto flex items-center justify-between border border-[#D8D0C5] dark:border-white/[0.08] bg-[#FBF8F2]/95 dark:bg-[#1D1922]/95 backdrop-blur-md px-3 sm:px-5 rounded-none pointer-events-auto transition-[max-width,box-shadow]"
          >
            {/* Left: Brand / Logo Group — slides inward on scroll */}
            <motion.div style={{ x: leftX }} className="flex items-center gap-4 lg:gap-6 shrink-0">
              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-2 rounded-none text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white"
              >
                <Menu size={20} />
              </button>

              {/* Brand Logo */}
              <Logo to="/app" size="sm" />
            </motion.div>

            {/* Center: Main Navigation Groups — remains centered */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium mx-auto">
              {/* Overview */}
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                      : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                  }`
                }
              >
                Overview
              </NavLink>

                {/* Learn Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnter('learn')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => toggleDropdown('learn')}
                    aria-expanded={activeDropdown === 'learn'}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-b-2 ${
                      isLearnActive
                        ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                        : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                    }`}
                  >
                    <span>Learn</span>
                    <ChevronDown size={14} className={`transition-transform duration-150 ${activeDropdown === 'learn' ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'learn' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-1 w-64 z-50"
                      >
                        <div className="bg-[#FBF8F2] dark:bg-[#1D1922] border border-[#D8D0C5] dark:border-white/[0.08] shadow-lg p-2 rounded-[2px]">
                          {learnItems.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `flex items-start gap-3 p-2 transition-colors ${
                                  isActive
                                    ? 'bg-[#E8E1D7] dark:bg-[#28222F] text-[#6542C5] dark:text-[#B59AF7]'
                                    : 'hover:bg-[#E8E1D7]/60 dark:hover:bg-[#28222F]/60 text-[#211D28] dark:text-[#F5F0E8]'
                                }`
                              }
                            >
                              <item.icon size={16} className="mt-0.5 shrink-0 text-[#6542C5] dark:text-[#B59AF7]" />
                              <div>
                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                  <span>{item.label}</span>
                                  {item.badge && (
                                    <span className="text-[9px] px-1 bg-[#6542C5]/10 text-[#6542C5] dark:bg-[#B59AF7]/20 dark:text-[#B59AF7] font-mono">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#8A8192] leading-tight mt-0.5">{item.desc}</div>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Practice Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnter('practice')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => toggleDropdown('practice')}
                    aria-expanded={activeDropdown === 'practice'}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-b-2 ${
                      isPracticeActive
                        ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                        : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                    }`}
                  >
                    <span>Practice</span>
                    <ChevronDown size={14} className={`transition-transform duration-150 ${activeDropdown === 'practice' ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'practice' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-1 w-64 z-50"
                      >
                        <div className="bg-[#FBF8F2] dark:bg-[#1D1922] border border-[#D8D0C5] dark:border-white/[0.08] shadow-lg p-2 rounded-[2px]">
                          {practiceItems.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `flex items-start gap-3 p-2 transition-colors ${
                                  isActive
                                    ? 'bg-[#E8E1D7] dark:bg-[#28222F] text-[#6542C5] dark:text-[#B59AF7]'
                                    : 'hover:bg-[#E8E1D7]/60 dark:hover:bg-[#28222F]/60 text-[#211D28] dark:text-[#F5F0E8]'
                                }`
                              }
                            >
                              <item.icon size={16} className="mt-0.5 shrink-0 text-[#6542C5] dark:text-[#B59AF7]" />
                              <div>
                                <div className="text-xs font-semibold">{item.label}</div>
                                <div className="text-[11px] text-[#8A8192] leading-tight mt-0.5">{item.desc}</div>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tools Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnter('tools')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => toggleDropdown('tools')}
                    aria-expanded={activeDropdown === 'tools'}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-b-2 ${
                      isToolsActive
                        ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                        : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                    }`}
                  >
                    <span>Tools</span>
                    <ChevronDown size={14} className={`transition-transform duration-150 ${activeDropdown === 'tools' ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'tools' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-1 w-64 z-50"
                      >
                        <div className="bg-[#FBF8F2] dark:bg-[#1D1922] border border-[#D8D0C5] dark:border-white/[0.08] shadow-lg p-2 rounded-[2px]">
                          {toolsItems.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                `flex items-start gap-3 p-2 transition-colors ${
                                  isActive
                                    ? 'bg-[#E8E1D7] dark:bg-[#28222F] text-[#6542C5] dark:text-[#B59AF7]'
                                    : 'hover:bg-[#E8E1D7]/60 dark:hover:bg-[#28222F]/60 text-[#211D28] dark:text-[#F5F0E8]'
                                }`
                              }
                            >
                              <item.icon size={16} className="mt-0.5 shrink-0 text-[#6542C5] dark:text-[#B59AF7]" />
                              <div>
                                <div className="text-xs font-semibold">{item.label}</div>
                                <div className="text-[11px] text-[#8A8192] leading-tight mt-0.5">{item.desc}</div>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress */}
                <NavLink
                  to="/app/progress"
                  className={({ isActive }) =>
                    `px-3 py-1.5 transition-colors border-b-2 ${
                      isActive
                        ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                        : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                    }`
                  }
                >
                  Progress
                </NavLink>

              {/* Admin */}
              {user?.role === 'admin' && (
                <NavLink
                  to="/app/admin/coding"
                  className={({ isActive }) =>
                    `px-3 py-1.5 transition-colors border-b-2 ${
                      isActive
                        ? 'border-[#6542C5] text-[#6542C5] dark:border-[#B59AF7] dark:text-[#B59AF7] font-semibold'
                        : 'border-transparent text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>

            {/* Right: Connect Gemini status + Quick actions — slides inward on scroll */}
            <motion.div style={{ x: rightX }} className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Visible "Connect Gemini" pill / indicator */}
              <Link
                to="/app/settings"
                title={geminiStatus?.connected ? `Gemini Key Connected (${geminiStatus.keyHint})` : 'Connect Gemini API Key'}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-none transition-colors ${
                  geminiStatus?.connected
                    ? 'border-[#2F855A]/40 bg-[#F2FAF5] text-[#2F855A] dark:border-[#48BB78]/40 dark:bg-[#48BB78]/10 dark:text-[#48BB78]'
                    : 'border-[#F2B38C] bg-[#FDF6F0] text-[#D7713A] dark:border-[#F2B38C]/40 dark:bg-[#F2B38C]/10 dark:text-[#F2B38C] hover:bg-[#F2B38C]/20'
                }`}
              >
                {geminiStatus?.connected ? (
                  <>
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>AI Connected</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={13} className="shrink-0" />
                    <span>Connect Gemini</span>
                  </>
                )}
              </Link>

              {/* Search button */}
              <div className="relative">
                <button
                  onClick={openSearch}
                  aria-label="Search pages"
                  className="flex h-9 items-center gap-2 border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/60 px-2.5 text-xs text-[#5F5668] dark:text-[#B8AFBE] hover:border-[#6542C5] dark:hover:border-[#B59AF7] rounded-none transition-colors"
                >
                  <Search size={14} />
                  <span className="hidden md:inline">Search...</span>
                  <kbd className="hidden md:inline-block bg-[#D8D0C5]/60 dark:bg-white/10 px-1 py-0.2 text-[10px] font-mono">
                    /
                  </kbd>
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <>
                      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" onClick={() => setSearchOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-11 z-50 w-72 sm:w-80 border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-2.5 shadow-2xl rounded-none"
                      >
                        <input
                          ref={searchInputRef}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Jump to section or tool..."
                          className="w-full border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/40 dark:bg-[#28222F]/40 px-3 py-2 text-xs text-[#211D28] dark:text-[#F5F0E8] outline-none focus:border-[#6542C5] dark:focus:border-[#B59AF7] rounded-none"
                        />
                        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                          {searchResults.map((page) => (
                            <button
                              key={page.to}
                              onClick={() => {
                                navigate(page.to);
                                setSearchOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-xs font-medium text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] rounded-none transition-colors"
                            >
                              <page.icon size={15} className="text-[#6542C5] dark:text-[#B59AF7]" />
                              <span>{page.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="flex h-9 w-9 items-center justify-center border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/40 dark:bg-[#28222F]/40 text-[#5F5668] dark:text-[#B8AFBE] hover:text-[#211D28] dark:hover:text-white rounded-none transition-colors"
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setProfileOpen(false);
                    if (!notifOpen) markAllRead();
                  }}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/40 dark:bg-[#28222F]/40 text-[#5F5668] dark:text-[#B8AFBE] hover:text-[#211D28] dark:hover:text-white rounded-none transition-colors"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#6542C5] dark:bg-[#B59AF7]" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 z-50 w-80 border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 shadow-xl rounded-none"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#D8D0C5] dark:border-white/10">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8192]">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] text-[#6542C5] dark:text-[#B59AF7] font-semibold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="py-4 text-center text-xs text-[#8A8192]">
                              No new notifications
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className="p-2 text-xs hover:bg-[#E8E1D7]/50 dark:hover:bg-[#28222F]/50 transition-colors"
                              >
                                <p className="text-[#211D28] dark:text-[#F5F0E8]">{n.message}</p>
                                <p className="mt-0.5 text-[10px] text-[#8A8192]">{timeAgo(n.createdAt)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 border border-[#D8D0C5] dark:border-white/10 rounded-none hover:border-[#6542C5] transition-colors"
                >
                  <Avatar user={user} size={26} className="rounded-none text-xs" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 z-50 w-56 border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-2 shadow-xl rounded-none text-xs"
                      >
                        <div className="px-2 py-2 border-b border-[#D8D0C5] dark:border-white/10 mb-1">
                          <p className="font-semibold text-[#211D28] dark:text-[#F5F0E8] truncate">{user?.name || 'Student'}</p>
                          <p className="text-[10px] text-[#8A8192] truncate">{user?.email || ''}</p>
                        </div>

                        <Link
                          to="/app/settings"
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] text-[#211D28] dark:text-[#F5F0E8] transition-colors"
                        >
                          <SettingsIcon size={14} className="text-[#6542C5] dark:text-[#B59AF7]" />
                          <span>Settings & AI Keys</span>
                        </Link>

                        <Link
                          to="/app/profile"
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] text-[#211D28] dark:text-[#F5F0E8] transition-colors"
                        >
                          <HelpCircle size={14} className="text-[#6542C5] dark:text-[#B59AF7]" />
                          <span>Profile & Support</span>
                        </Link>

                        <div className="my-1 border-t border-[#D8D0C5] dark:border-white/10" />

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[#E53E3E] hover:bg-[#E53E3E]/10 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </header>
      )}

      {/* ============================================================
          MOBILE SLIDE-OVER DRAWER (Auto-close on navigation & Escape)
          ============================================================ */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#FBF8F2] dark:bg-[#1D1922] border-r border-[#D8D0C5] dark:border-white/10 p-4 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#D8D0C5] dark:border-white/10">
                  <Logo to="/app" size="sm" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-[#5F5668] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                  {/* Overview */}
                  <NavLink
                    to="/app"
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-none ${
                        isActive
                          ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                          : 'text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]'
                      }`
                    }
                  >
                    <LayoutDashboard size={16} />
                    <span>Overview</span>
                  </NavLink>

                  {/* Learn */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Learn</div>
                    {learnItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-none ${
                            isActive
                              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                              : 'text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]'
                          }`
                        }
                      >
                        <item.icon size={15} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>

                  {/* Practice */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Practice</div>
                    {practiceItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-none ${
                            isActive
                              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                              : 'text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]'
                          }`
                        }
                      >
                        <item.icon size={15} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>

                  {/* Tools */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">Tools</div>
                    {toolsItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-none ${
                            isActive
                              ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                              : 'text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]'
                          }`
                        }
                      >
                        <item.icon size={15} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>

                  {/* Progress & Settings */}
                  <div className="pt-2 border-t border-[#D8D0C5] dark:border-white/10 space-y-1">
                    <NavLink
                      to="/app/progress"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]"
                    >
                      <LineChart size={15} />
                      <span>Progress & Stats</span>
                    </NavLink>
                    <NavLink
                      to="/app/settings"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#211D28] dark:text-[#F5F0E8] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]"
                    >
                      <SettingsIcon size={15} />
                      <span>Settings & AI Keys</span>
                    </NavLink>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Logout */}
              <div className="pt-3 border-t border-[#D8D0C5] dark:border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[#E53E3E] hover:bg-[#E53E3E]/10"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          MAIN PAGE CONTAINER
          ============================================================ */}
      <main
        className={
          focusMode
            ? 'h-screen min-h-0 overflow-hidden'
            : 'flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
        }
      >
        {children}
      </main>
    </div>
  );
}

export { X };
