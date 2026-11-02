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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useNotifications } from '@/store/NotificationContext';

export interface NavGroupItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavGroupItem[];
}

const SIDEBAR_STORAGE_KEY = 'cadence_nav_collapsed_v2';

export interface AppLayoutProps {
  children: ReactNode;
  focusMode?: boolean;
  onOpenMobileMenu?: () => void;
}

export function AppLayout({ children, focusMode = false }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

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
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Grouped Navigation Hierarchy
  const navGroups: NavGroup[] = [
    {
      id: 'core',
      label: 'Core',
      items: [{ to: '/app', label: 'Overview', icon: LayoutDashboard, end: true }],
    },
    {
      id: 'learning',
      label: 'Learning',
      items: [
        { to: '/app/journey', label: 'Learning Journey', icon: Compass, badge: 'Curriculum' },
        { to: '/app/plan', label: 'My Learning', icon: BookOpen },
        { to: '/app/assessments', label: 'Practice & Quizzes', icon: Target },
      ],
    },
    {
      id: 'coding',
      label: 'Coding & Mastery',
      items: [
        { to: '/app/coding', label: 'Coding Practice', icon: Code },
        { to: '/app/comprehension', label: 'Code Comprehension', icon: GraduationCap },
        { to: '/app/debugger', label: 'Code Debugger', icon: Code2 },
      ],
    },
    {
      id: 'tools',
      label: 'Support & Tools',
      items: [
        { to: '/app/tutor', label: 'AI Tutor', icon: Sparkles },
        { to: '/app/groups', label: 'Study Groups', icon: Users },
        { to: '/app/resume', label: 'Resume Maker', icon: FileText },
        { to: '/app/progress', label: 'Progress & Stats', icon: LineChart },
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

  const searchResults = searchQuery.trim()
    ? allSearchable.filter((p) => p.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allSearchable;

  useEffect(() => {
    const handleOpenNav = () => setMobileOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setSearchOpen(false);
        setNotifOpen(false);
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

        // Do not intercept '/' when user is typing inside an input/editor
        if (!isEditable) {
          e.preventDefault();
          openSearch();
        }
      }
    };
    window.addEventListener('cadence:open-navigation', handleOpenNav);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('cadence:open-navigation', handleOpenNav);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setNotifOpen(false);
    setSearchQuery('');
    setMobileOpen(false);
  }, [location.pathname]);

  const openSearch = () => {
    setSearchOpen(true);
    setNotifOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const goToSearchResult = (to: string) => {
    navigate(to);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const toggleNotifications = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next) {
        setSearchOpen(false);
        markAllRead();
      }
      return next;
    });
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

  // Derive dynamic breadcrumbs
  const currentItem = allSearchable.find((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  });

  const SidebarContent = (
    <div className="flex h-full flex-col min-h-0 bg-white dark:bg-[#111827]">
      {/* Brand Header */}
      <div
        className={`shrink-0 flex items-center ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        } h-16 border-b border-slate-100 dark:border-slate-800/80`}
      >
        <Logo to="/app" iconOnly={collapsed} size="sm" />
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:block transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Nav groups scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                collapsed={collapsed}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </div>
        ))}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {!collapsed && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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

      {/* Footer Account Card */}
      <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-[#0E1524]">
        {/* Theme button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
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
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Student'}
                </p>
                <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
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
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0B1220] dark:text-slate-100 transition-colors duration-200 flex">
      {/* Desktop Fixed Sidebar */}
      {!focusMode && (
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111827] transition-all duration-200 ${
            collapsed ? 'w-18' : 'w-64'
          }`}
        >
          {SidebarContent}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#111827] shadow-xl border-r border-slate-200 dark:border-slate-800 flex flex-col"
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
        {/* Contextual App Header (Non-focus mode) */}
        {!focusMode && (
          <header className="sticky top-0 z-20 h-16 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
            {/* Left: Mobile trigger & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <Link
                  to="/app"
                  className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cadence
                </Link>
                {currentItem && currentItem.to !== '/app' && (
                  <>
                    <ChevronRight size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentItem.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={openSearch}
                  aria-label="Search pages"
                  className="flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <Search size={14} />
                  <span className="hidden sm:inline">Search...</span>
                  <kbd className="hidden sm:inline-block rounded bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono">
                    /
                  </kbd>
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-11 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-2.5 shadow-xl"
                      >
                        <input
                          ref={searchInputRef}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Jump to page..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs outline-none focus:border-blue-600 dark:focus:border-blue-400"
                        />
                        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                          {searchResults.map((page) => (
                            <button
                              key={page.to}
                              onClick={() => goToSearchResult(page.to)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <page.icon size={15} className="text-slate-400" />
                              <span>{page.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
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
                        className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 shadow-xl"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] text-blue-600 font-semibold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-400">
                              No new notifications
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className="rounded-lg p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                              >
                                <p className="text-slate-700 dark:text-slate-200">{n.message}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
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
                <Avatar user={user} size={30} className="border border-slate-200 dark:border-slate-700" />
              </Link>
            </div>
          </header>
        )}

        {/* Page Container */}
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
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  collapsed: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
        }`
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400"
            />
          )}
          <Icon
            size={16}
            className={`shrink-0 transition-transform duration-150 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}
          />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && badge && (
            <span className="ml-auto rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export { X };
