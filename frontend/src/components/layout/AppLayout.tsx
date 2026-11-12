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
  PanelLeftClose,
  PanelLeft,
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
  ChevronRight,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  Clock,
  Play,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useNotifications } from '@/store/NotificationContext';
import { userApiKeyService, type UserApiKeyStatus } from '@/services/userApiKeyService';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { FocusModeModal } from '@/components/ui/FocusModeModal';
import { CustomCursor, AmbientBlob } from '@/components/ui/CustomCursor';
import { BackToTop } from '@/components/ui/BackToTop';
import { Tooltip } from '@/components/ui/Tooltip';

export interface NavGroupItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: string;
  shortcut?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavGroupItem[];
}

const SIDEBAR_STORAGE_KEY = 'cadence_nav_collapsed_v2';
const GROUP_STATE_STORAGE_KEY = 'cadence_nav_groups_v2';

export interface AppLayoutProps {
  children: ReactNode;
  focusMode?: boolean;
}

export function AppLayout({ children, focusMode = false }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Top Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  // Top header frosted glass state
  const [headerScrolled, setHeaderScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Modals & Command Palette
  const [commandOpen, setCommandOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);

  // Gemini API Key connection status
  const [geminiStatus, setGeminiStatus] = useState<UserApiKeyStatus | null>(null);

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

  // Persist sidebar collapsed preference
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Persist collapsible nav groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(GROUP_STATE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { coding: true, tools: true, admin: true };
    } catch {
      return { coding: true, tools: true, admin: true };
    }
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(GROUP_STATE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Grouped Navigation Hierarchy
  const navGroups: NavGroup[] = [
    {
      id: 'core',
      label: 'Core',
      items: [{ to: '/app', label: 'Overview', icon: LayoutDashboard, end: true, shortcut: 'G D' }],
    },
    {
      id: 'learning',
      label: 'Learning',
      items: [
        { to: '/app/journey', label: 'Learning Journey', icon: Compass, badge: 'Curriculum', shortcut: 'G J' },
        { to: '/app/plan', label: 'My Learning', icon: BookOpen, shortcut: 'G P' },
        { to: '/app/assessments', label: 'Practice & Quizzes', icon: Target, shortcut: 'G Q' },
      ],
    },
    {
      id: 'coding',
      label: 'Coding & Mastery',
      items: [
        { to: '/app/coding', label: 'Coding Practice', icon: Code, shortcut: 'G C' },
        { to: '/app/comprehension', label: 'Code Comprehension', icon: GraduationCap, shortcut: 'G M' },
        { to: '/app/debugger', label: 'Code Debugger', icon: Code2, shortcut: 'G X' },
      ],
    },
    {
      id: 'tools',
      label: 'Support & Tools',
      items: [
        { to: '/app/tutor', label: 'AI Tutor', icon: Sparkles, shortcut: 'G T' },
        { to: '/app/groups', label: 'Study Groups', icon: Users, shortcut: 'G G' },
        { to: '/app/resume', label: 'Resume Maker', icon: FileText, shortcut: 'G R' },
        { to: '/app/progress', label: 'Progress & Stats', icon: LineChart, shortcut: 'G S' },
      ],
    },
    ...(user?.role === 'admin'
      ? [
          {
            id: 'admin',
            label: 'Administration',
            items: [
              {
                to: '/app/admin/coding',
                label: 'Question Studio',
                icon: ShieldAlert,
                badge: 'Admin',
                shortcut: 'G A',
              },
            ],
          },
        ]
      : []),
  ];

  const secondaryNav: NavGroupItem[] = [
    { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/app/profile', label: 'Profile & Support', icon: HelpCircle },
  ];

  const allSearchable = [
    ...navGroups.flatMap((g) => g.items),
    ...secondaryNav,
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K or '/' to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }

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
          setCommandOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const currentItem = allSearchable.find((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  });

  const SidebarContent = (
    <div className="flex h-full flex-col min-h-0 bg-[#FBF8F2] dark:bg-[#1D1922]">
      {/* Brand Header */}
      <div
        className={`shrink-0 flex items-center ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        } h-16 border-b border-[#D8D0C5] dark:border-white/10`}
      >
        <Logo to="/app" iconOnly={collapsed} size="sm" />
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-1.5 text-[#5F5668] hover:bg-[#E8E1D7] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:bg-[#28222F] dark:hover:text-white lg:block transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Start Session Quick CTA at Top */}
      {!collapsed && (
        <div className="p-3 pb-0">
          <Link to="/app/session" className="block">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6542C5] dark:bg-[#B59AF7] py-2 px-3 text-xs font-bold text-white dark:text-[#141217] shadow-sm hover:opacity-95 transition-opacity">
              <Play size={13} className="fill-current" />
              <span>Start Session</span>
            </button>
          </Link>
        </div>
      )}

      {/* Nav groups scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
        {navGroups.map((group) => {
          const isCollapsible = group.id !== 'core' && group.id !== 'learning';
          const isGroupOpen = !isCollapsible || openGroups[group.id] !== false;

          return (
            <div key={group.id} className="space-y-1">
              {!collapsed && (
                <div
                  onClick={() => isCollapsible && toggleGroup(group.id)}
                  className={`flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8192] ${
                    isCollapsible ? 'cursor-pointer hover:text-[#211D28] dark:hover:text-white' : ''
                  }`}
                >
                  <span>{group.label}</span>
                  {isCollapsible && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${
                        isGroupOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </div>
              )}

              {isGroupOpen &&
                group.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    {...item}
                    collapsed={collapsed}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
            </div>
          );
        })}

        <div className="pt-2 border-t border-[#D8D0C5] dark:border-white/10">
          {!collapsed && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8192]">
              Preferences
            </div>
          )}
          {secondaryNav.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </div>

      {/* Pinned Bottom Area */}
      <div className="shrink-0 p-3 border-t border-[#D8D0C5] dark:border-white/10 space-y-2 bg-[#F1EDE6]/60 dark:bg-[#141217]">
        {/* Gemini API Key indicator */}
        <Link
          to="/app/settings"
          title={geminiStatus?.connected ? `Gemini Key Connected (${geminiStatus.keyHint})` : 'Connect Gemini API Key'}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            collapsed ? 'justify-center' : 'justify-between'
          } ${
            geminiStatus?.connected
              ? 'border-[#2F855A]/30 bg-[#2F855A]/10 text-[#2F855A] dark:text-[#48BB78]'
              : 'border-[#F2B38C]/40 bg-[#FDF6F0] text-[#D7713A] dark:bg-[#F2B38C]/10 dark:text-[#F2B38C]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {geminiStatus?.connected ? (
              <CheckCircle2 size={14} className="shrink-0" />
            ) : (
              <KeyRound size={14} className="shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">
                {geminiStatus?.connected ? 'AI Connected' : 'Connect Gemini'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono opacity-80">
              {geminiStatus?.connected ? geminiStatus.keyHint || 'Active' : 'Setup'}
            </span>
          )}
        </Link>

        {/* Theme button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#5F5668] dark:text-[#B8AFBE] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>}
        </button>

        {/* User preview */}
        <div
          className={`flex items-center gap-2.5 rounded-xl p-2 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar user={user} size={28} className="shrink-0 text-xs" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#211D28] dark:text-[#F5F0E8]">
                  {user?.name || 'Student'}
                </p>
                <p className="truncate text-[10px] text-[#8A8192]">
                  {user?.role === 'admin' ? 'Administrator' : 'Learner'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-1 text-[#8A8192] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] hover:text-[#E53E3E] dark:hover:text-[#FC8181] transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1EDE6] text-[#211D28] dark:bg-[#141217] dark:text-[#F5F0E8] transition-colors duration-200 flex">
      {/* Custom Cursor & Ambient background blob */}
      <CustomCursor />
      <AmbientBlob />
      <BackToTop />

      {/* Top Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-1 bg-[#6542C5] dark:bg-[#B59AF7] origin-left"
        style={{ scaleX }}
      />

      {/* Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Focus Mode Pomodoro Modal */}
      <FocusModeModal isOpen={focusModalOpen} onClose={() => setFocusModalOpen(false)} />

      {/* Desktop Fixed Sidebar */}
      {!focusMode && (
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] transition-all duration-200 ${
            collapsed ? 'w-18' : 'w-64'
          }`}
        >
          {SidebarContent}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#D8D0C5] dark:border-white/20 bg-[#FBF8F2] dark:bg-[#1D1922] text-[#5F5668] dark:text-[#B8AFBE] shadow-sm hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors"
            >
              <PanelLeft size={12} />
            </button>
          )}
        </aside>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#FBF8F2] dark:bg-[#1D1922] shadow-xl border-r border-[#D8D0C5] dark:border-white/10 flex flex-col"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-200 ${
          focusMode ? 'pl-0' : collapsed ? 'lg:pl-18' : 'lg:pl-64'
        }`}
      >
        {/* Contextual App Header with Frosted Glass transition after 8px scroll */}
        {!focusMode && (
          <header
            className={`sticky top-0 z-20 h-16 border-b px-4 sm:px-6 flex items-center justify-between transition-all duration-200 ${
              headerScrolled
                ? 'border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2]/85 dark:bg-[#1D1922]/85 backdrop-blur-xl shadow-xs'
                : 'border-transparent bg-transparent'
            }`}
          >
            {/* Left: Mobile trigger & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open mobile navigation"
                className="lg:hidden rounded-lg p-2 text-[#5F5668] dark:text-[#B8AFBE] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs font-medium text-[#5F5668] dark:text-[#B8AFBE]">
                <Link to="/app" className="hover:text-[#6542C5] dark:hover:text-[#B59AF7] transition-colors">
                  App
                </Link>
                {currentItem && (
                  <>
                    <ChevronRight size={12} className="text-[#8A8192]" />
                    <span className="font-semibold text-[#211D28] dark:text-[#F5F0E8]">{currentItem.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="flex items-center gap-2">
              {/* Focus Mode button */}
              <button
                onClick={() => setFocusModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/60 px-3 text-xs font-medium text-[#5F5668] dark:text-[#B8AFBE] hover:text-[#6542C5] dark:hover:text-[#B59AF7] transition-colors"
              >
                <Clock size={14} />
                <span>Focus Mode</span>
              </button>

              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette"
                className="flex h-9 items-center gap-2 rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/60 px-3 text-xs text-[#5F5668] dark:text-[#B8AFBE] hover:border-[#6542C5]/50 dark:hover:border-[#B59AF7]/50 transition-colors"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-block rounded bg-[#D8D0C5]/60 dark:bg-[#141217]/60 px-1.5 py-0.5 text-[10px] font-mono">
                  Ctrl K
                </kbd>
              </button>

              {/* Notifications with Bell Swing & Pulse Dot */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8D0C5] dark:border-white/10 bg-[#E8E1D7]/50 dark:bg-[#28222F]/60 text-[#5F5668] dark:text-[#B8AFBE] hover:bg-[#E8E1D7] dark:hover:bg-[#28222F] transition-colors"
                >
                  <Bell size={15} className="transition-transform group-hover:rotate-12" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F2B38C] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D7713A]" />
                    </span>
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
                        className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] p-3 shadow-xl"
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
                                className="rounded-lg p-2 text-xs hover:bg-[#E8E1D7] dark:hover:bg-[#28222F]/60 transition-colors"
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

              {/* Profile link */}
              <Link to="/app/profile" aria-label="Go to profile" className="ml-1">
                <Avatar user={user} size={30} className="border border-[#D8D0C5] dark:border-white/10" />
              </Link>
            </div>
          </header>
        )}

        {/* Page Container */}
        <main
          className={
            focusMode
              ? 'h-screen min-h-0 overflow-hidden'
              : 'flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20'
          }
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar for Main 4-5 Pages */}
      {!focusMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around h-16 border-t border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2]/95 dark:bg-[#1D1922]/95 backdrop-blur-md px-2">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#8A8192]'
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/app/journey"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#8A8192]'
              }`
            }
          >
            <Compass size={18} />
            <span>Journey</span>
          </NavLink>
          <NavLink
            to="/app/coding"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#8A8192]'
              }`
            }
          >
            <Code size={18} />
            <span>Coding</span>
          </NavLink>
          <NavLink
            to="/app/tutor"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#8A8192]'
              }`
            }
          >
            <Sparkles size={18} />
            <span>AI Tutor</span>
          </NavLink>
          <NavLink
            to="/app/progress"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#6542C5] dark:text-[#B59AF7]' : 'text-[#8A8192]'
              }`
            }
          >
            <LineChart size={18} />
            <span>Stats</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
  badge,
  shortcut,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  collapsed: boolean;
  badge?: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip content={label} side="right">
      <NavLink
        to={to}
        end={end}
        onClick={onClick}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
            collapsed ? 'justify-center' : 'w-full'
          } ${
            isActive
              ? 'bg-[#6542C5]/10 text-[#6542C5] font-semibold dark:bg-[#B59AF7]/15 dark:text-[#B59AF7]'
              : 'text-[#5F5668] hover:bg-[#E8E1D7] hover:text-[#211D28] dark:text-[#B8AFBE] dark:hover:bg-[#28222F] dark:hover:text-[#F5F0E8]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {/* Sliding Active Pill with 3px accent bar on left */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#6542C5] dark:bg-[#B59AF7]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              size={16}
              className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                isActive
                  ? 'text-[#6542C5] dark:text-[#B59AF7]'
                  : 'text-[#8A8192] group-hover:text-[#5F5668] dark:group-hover:text-[#F5F0E8]'
              }`}
            />
            {!collapsed && (
              <span className="truncate transition-transform duration-150 group-hover:translate-x-0.5">
                {label}
              </span>
            )}
            {!collapsed && badge && (
              <span className="ml-auto rounded-md bg-[#E8E1D7] dark:bg-[#28222F] px-1.5 py-0.5 text-[9px] font-bold text-[#5F5668] dark:text-[#B8AFBE] uppercase tracking-wider">
                {badge}
              </span>
            )}
            {!collapsed && !badge && shortcut && (
              <span className="ml-auto text-[10px] font-mono text-[#8A8192] opacity-0 transition-opacity group-hover:opacity-100">
                {shortcut}
              </span>
            )}
          </>
        )}
      </NavLink>
    </Tooltip>
  );
}

export { X };
