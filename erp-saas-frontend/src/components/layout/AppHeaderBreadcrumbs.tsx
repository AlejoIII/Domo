import { Fragment, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getBreadcrumbs } from '@/lib/route-context';
import { cn } from '@/lib/cn';

export function AppHeaderBreadcrumbs() {
  const { pathname, search } = useLocation();
  const crumbs = useMemo(
    () => getBreadcrumbs(pathname, new URLSearchParams(search)),
    [pathname, search],
  );

  return (
    <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            )}
            {crumb.to && !isLast ? (
              <Link
                to={crumb.to}
                className="truncate text-muted-foreground transition hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn('truncate', isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
