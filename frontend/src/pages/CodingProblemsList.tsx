import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { codingService } from '@/services/codingService';
import type { PublicCodingProblemListItem, ProblemDifficulty } from '@/types/coding';

export function CodingProblemsList() {
  const [problems, setProblems] = useState<PublicCodingProblemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | ''>('');
  const [topic, setTopic] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Available filters from backend
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load available filters once
  useEffect(() => {
    codingService
      .getPublishedFilters()
      .then((res) => {
        setAvailableTopics(res.topics || []);
        setAvailableTags(res.tags || []);
      })
      .catch((err) => {
        console.warn('Could not load filters:', err);
      });
  }, []);

  // Fetch problems based on current filters
  const loadProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * limit;
      const res = await codingService.getPublishedProblems({
        difficulty: difficulty || undefined,
        topic: topic || undefined,
        tag: tag || undefined,
        search: search.trim() || undefined,
        limit,
        skip,
      });
      setProblems(res.problems || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load coding problems.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, topic, tag, search, page]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProblems();
  };

  const handleDifficultyChange = (val: string) => {
    setDifficulty(val as ProblemDifficulty | '');
    setPage(1);
  };

  const handleTopicChange = (val: string) => {
    setTopic(val);
    setPage(1);
  };

  const handleTagChange = (val: string) => {
    setTag(val);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getDifficultyBadge = (diff: ProblemDifficulty) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Easy
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Medium
          </span>
        );
      case 'hard':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            Hard
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          title="Coding Practice Library"
          subtitle="Explore published competitive programming challenges across algorithms, data structures, and mathematical problem-solving."
        />

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problem title, topic, or tag..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/60 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6542C5]/40 dark:focus:ring-[#B59AF7]/30"
              />
            </div>
            <button
              type="submit"
              className="btn-render-sweep px-4 py-2 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              {/* Difficulty Dropdown */}
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6542C5]/40 dark:focus:ring-[#B59AF7]/30"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {/* Topic Dropdown */}
              <select
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6542C5]/40 dark:focus:ring-[#B59AF7]/30"
              >
                <option value="">All Topics</option>
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Tag Dropdown */}
              {availableTags.length > 0 && (
                <select
                  value={tag}
                  onChange={(e) => handleTagChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6542C5]/40 dark:focus:ring-[#B59AF7]/30"
                >
                  <option value="">All Tags</option>
                  {availableTags.map((tg) => (
                    <option key={tg} value={tg}>
                      #{tg}
                    </option>
                  ))}
                </select>
              )}

              {(difficulty || topic || tag || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty('');
                    setTopic('');
                    setTag('');
                    setSearch('');
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs text-[#6542C5] dark:text-[#B59AF7] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-slate-400">
              Showing <span className="font-semibold text-gray-800 dark:text-slate-200">{problems.length}</span> of{' '}
              <span className="font-semibold text-gray-800 dark:text-slate-200">{total}</span> published challenges
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-[#6542C5] dark:text-[#B59AF7] animate-spin mx-auto" />
            <p className="text-xs text-gray-500 dark:text-slate-400">Loading published challenges...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 text-center rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={loadProblems}
              className="px-3 py-1.5 rounded-lg text-xs bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Honest Empty State */}
        {!isLoading && !error && problems.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
            <Code2 className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              No Published Challenges Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              {difficulty || topic || tag || search
                ? 'No published challenges match the selected filters. Try broadening your search or resetting filters.'
                : 'There are currently no published coding challenges in the database. When instructors publish new challenges, they will appear here.'}
            </p>
          </div>
        )}

        {/* Problems Grid */}
        {!isLoading && !error && problems.length > 0 && (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 min-w-0">
            {problems.map((problem) => (
              <StaggerItem key={problem.id}>
              <Link
                to={`/app/coding/problems/${encodeURIComponent(problem.slug)}`}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] dark:bg-[#1D1922] p-5 shadow-sm hover:border-[#6542C5]/30 dark:hover:border-[#B59AF7]/30 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {getDifficultyBadge(problem.difficulty)}
                    <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {problem.topic}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#6542C5] dark:group-hover:text-[#B59AF7] transition-colors line-clamp-2">
                    {problem.title}
                  </h3>

                  {problem.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-700"
                        >
                          #{t}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{problem.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Time limit">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {problem.executionLimits.timeLimitMs}ms
                    </span>
                    <span className="flex items-center gap-1" title="Memory limit">
                      <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                      {problem.executionLimits.memoryLimitMb}MB
                    </span>
                  </div>

                  <span className="text-[#6542C5] dark:text-[#B59AF7] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Solve <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

