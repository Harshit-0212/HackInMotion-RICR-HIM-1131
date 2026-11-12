import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center dark:border-ink-700 dark:bg-ink-900/40">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-[#6542C5] dark:bg-primary-900/40 dark:text-[#B59AF7]">
        <Icon size={26} />
      </div>
      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
