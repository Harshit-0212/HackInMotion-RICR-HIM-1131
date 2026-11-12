import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Compass,
  BookOpen,
  Target,
  Code,
  GraduationCap,
  Code2,
  Sparkles,
  Users,
  FileText,
  LineChart,
  Settings,
  HelpCircle,
  Clock,
  ArrowRight,
  BookX,
  Layers,
  Calendar,
  FolderOpen,
  Trophy,
  BrainCircuit,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  to: string;
  icon: any;
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard & Overview', category: 'Pages', to: '/app', icon: LayoutDashboard },
  { id: 'mistakes', title: 'Mistake Notebook & Error Tracker', category: 'Learning', to: '/app/mistakes', icon: BookX },
  { id: 'flashcards', title: 'Flashcards & Spaced Repetition (SM-2)', category: 'Learning', to: '/app/flashcards', icon: Layers },
  { id: 'calendar', title: 'Study Calendar & Deadlines', category: 'Learning', to: '/app/calendar', icon: Calendar },
  { id: 'library', title: 'Notes & Document Library', category: 'Tools', to: '/app/library', icon: FolderOpen },
  { id: 'interview', title: 'AI Mock Interview & Evaluation', category: 'Career', to: '/app/interview', icon: BrainCircuit },
  { id: 'leaderboard', title: 'Leaderboard & Global Ranks', category: 'Tools', to: '/app/leaderboard', icon: Trophy },
  { id: 'journey', title: 'Learning Journey', category: 'Curriculum', to: '/app/journey', icon: Compass },
  { id: 'plan', title: 'My Learning Plan', category: 'Curriculum', to: '/app/plan', icon: BookOpen },
  { id: 'assess', title: 'Practice & Quizzes', category: 'Practice', to: '/app/assessments', icon: Target },
  { id: 'coding', title: 'Coding Practice Arena', category: 'Practice', to: '/app/coding', icon: Code },
  { id: 'comp', title: 'Code Comprehension', category: 'Practice', to: '/app/comprehension', icon: GraduationCap },
  { id: 'debug', title: 'Code Debugger', category: 'Practice', to: '/app/debugger', icon: Code2 },
  { id: 'tutor', title: 'Ask AI Tutor...', category: 'AI Tools', to: '/app/tutor', icon: Sparkles },
  { id: 'groups', title: 'Study Groups', category: 'Tools', to: '/app/groups', icon: Users },
  { id: 'resume', title: 'Resume Maker & ATS Analyzer', category: 'Career', to: '/app/resume', icon: FileText },
  { id: 'progress', title: 'Progress & Stats', category: 'Analytics', to: '/app/progress', icon: LineChart },
  { id: 'settings', title: 'Settings & AI Keys', category: 'Preferences', to: '/app/settings', icon: Settings },
  { id: 'profile', title: 'Profile & Support', category: 'Preferences', to: '/app/profile', icon: HelpCircle },
];

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()),
      )
    : COMMANDS;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectItem = (item: CommandItem) => {
    onClose();
    navigate(item.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        selectItem(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#D8D0C5] dark:border-white/10 bg-[#FBF8F2] dark:bg-[#1D1922] shadow-2xl"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-[#D8D0C5] dark:border-white/10 px-4 py-3.5">
              <Search size={18} className="text-[#8A8192] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search pages... (↑ ↓ to navigate, ↵ to select)"
                className="w-full bg-transparent text-sm text-[#211D28] dark:text-[#F5F0E8] placeholder-[#8A8192] outline-none"
              />
              <span className="rounded bg-[#E8E1D7] dark:bg-[#28222F] px-1.5 py-0.5 text-[10px] font-mono text-[#5F5668] dark:text-[#B8AFBE]">
                ESC
              </span>
            </div>

            {/* Suggestions List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8A8192]">
                  No matching results found for "{query}".
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217]'
                          : 'text-[#211D28] hover:bg-[#E8E1D7] dark:text-[#F5F0E8] dark:hover:bg-[#28222F]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                            isSelected
                              ? 'bg-white/20'
                              : 'bg-[#E8E1D7] dark:bg-[#28222F] text-[#6542C5] dark:text-[#B59AF7]'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.title}</p>
                          <p
                            className={`text-[10px] ${
                              isSelected ? 'opacity-80' : 'text-[#8A8192]'
                            }`}
                          >
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={14} className="opacity-60 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

