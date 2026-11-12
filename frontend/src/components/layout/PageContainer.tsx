import type { ReactNode } from 'react';

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const MAX_WIDTHS = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * PageContainer provides uniform responsive margins, padding, and max-widths
 * across all pages in the app so cards and sections fill width consistently
 * without empty horizontal gaps.
 */
export function PageContainer({
  children,
  className = '',
  maxWidth = '7xl',
}: PageContainerProps) {
  return (
    <div className={`w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 @container ${MAX_WIDTHS[maxWidth]} ${className}`}>
      {children}
    </div>
  );
}

export interface CardGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
}

/**
 * CardGrid: 12-column responsive grid with dense packing, auto stretch, and container query support.
 * Ensures edge-to-edge row alignment and prevents orphan dead spaces.
 */
export function CardGrid({ children, className = '', cols = 12 }: CardGridProps) {
  const colClass =
    cols === 12
      ? 'grid-cols-1 md:grid-cols-6 lg:grid-cols-12'
      : cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : cols === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : cols === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1';

  return (
    <div
      className={`grid ${colClass} gap-6 grid-flow-dense items-stretch w-full min-w-0 ${className}`}
    >
      {children}
    </div>
  );
}

