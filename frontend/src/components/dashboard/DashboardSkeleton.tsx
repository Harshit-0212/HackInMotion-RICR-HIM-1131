export function DashboardSkeleton() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-44 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Hero Continue Learning Skeleton */}
      <div className="h-56 w-full rounded-3xl bg-slate-200/80 dark:bg-slate-800/80 p-7 space-y-4">
        <div className="h-5 w-36 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="h-8 w-3/5 rounded-xl bg-slate-300 dark:bg-slate-700" />
        <div className="h-4 w-2/5 rounded-lg bg-slate-300/60 dark:bg-slate-700/60" />
        <div className="h-3 w-full rounded-full bg-slate-300/40 dark:bg-slate-700/40" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="h-64 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
      </div>

      {/* Course cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}
