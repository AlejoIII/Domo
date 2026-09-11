import { Link } from 'react-router-dom';
import { ArrowUpCircle } from 'lucide-react';
import { useNavigationPrefs } from '@/hooks/useNavigationPrefs';
import { planShowsAds } from '@/config/plan-features.config';
import { useSidebarStore } from '@/store/sidebar.store';
import { cn } from '@/lib/cn';

export function FreePlanBanner() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const { planFeatures, planName, isLoading } = useNavigationPrefs();

  if (isLoading || !planShowsAds(planFeatures)) return null;

  return (
    <div className={cn('border-b border-border/50 p-2', collapsed && 'px-1')}>
      <Link
        to="/settings?tab=billing"
        title="Mejorar plan"
        className={cn(
          'flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs transition-colors duration-300 ease-in-out hover:bg-primary/15',
          collapsed && 'justify-center px-2',
        )}
      >
        <ArrowUpCircle className="h-4 w-4 shrink-0 text-primary" />
        {!collapsed && (
          <span className="leading-snug text-foreground/90">
            <span className="font-medium">{planName ?? 'Free'}</span>
            {' · '}
            <span className="text-primary">Actualizar a Premium</span>
          </span>
        )}
      </Link>
    </div>
  );
}
