import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EntityRecordWidth = 'comfortable' | 'wide' | 'full';

const WIDTH_CLASS: Record<EntityRecordWidth, string> = {
  comfortable: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-[1600px]',
};

interface EntityRecordLayoutProps {
  header: ReactNode;
  summary?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  width?: EntityRecordWidth;
}

export function EntityRecordLayout({
  header,
  summary,
  aside,
  footer,
  children,
  width = 'wide',
}: EntityRecordLayoutProps) {
  const hasAside = Boolean(aside);

  return (
    <div className={cn('mx-auto w-full space-y-4', WIDTH_CLASS[width])}>
      {header}
      {summary}
      <div
        className={cn(
          'grid gap-4',
          hasAside && 'lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)]',
        )}
      >
        <div className="min-w-0 space-y-4">{children}</div>
        {hasAside && (
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
            {aside}
          </aside>
        )}
      </div>
      {footer}
    </div>
  );
}
