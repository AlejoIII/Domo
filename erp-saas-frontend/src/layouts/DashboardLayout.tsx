import { Suspense } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Settings, Shield } from 'lucide-react';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { FreePlanBanner } from '@/components/layout/FreePlanBanner';
import { AppHeaderBreadcrumbs } from '@/components/layout/AppHeaderBreadcrumbs';
import { GlobalQuickSearch } from '@/components/layout/GlobalQuickSearch';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';
import { BetaFeedbackButton } from '@/components/layout/BetaFeedbackButton';
import { PermissionRoute } from '@/routes/PermissionRoute';
import { useAuthStore } from '@/store/auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { useThemeStore } from '@/store/theme.store';
import { usePreferencesStore } from '@/store/preferences.store';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyStore } from '@/store/company.store';
import { cn } from '@/lib/cn';
import { Loader } from '@/components/ui/Loader';

export function DashboardLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const isPlatformAdmin = useAuthStore((s) => s.user?.isPlatformAdmin);
  const { theme, toggle: toggleTheme } = useThemeStore();
  const density = usePreferencesStore((s) => s.density);
  usePreferencesStore((s) => s.dateFormat);
  useCompanyStore((s) => s.currency);
  useCompanySettings();

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 ease-in-out">
      <aside className={cn(
        'app-chrome flex flex-col border-r border-border/70 bg-sidebar',
        'transition-[width,background-color,border-color,color,box-shadow] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}>
        <div className="flex h-14 items-center justify-between border-b border-border/50 px-4 font-semibold text-primary transition-colors duration-300 ease-in-out">
          {!collapsed && <span>Domo</span>}
          <button onClick={toggleSidebar} className="rounded p-1 transition-colors duration-300 ease-in-out hover:bg-muted">
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300 ease-in-out', collapsed && 'rotate-180')} />
          </button>
        </div>
        <FreePlanBanner />
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <ImpersonationBanner />
        <header className="app-chrome relative z-40 flex h-14 items-center gap-4 border-b border-border/70 bg-card/60 px-6 backdrop-blur-sm transition-colors duration-300 ease-in-out">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <AppHeaderBreadcrumbs />
            <GlobalQuickSearch className="ml-auto hidden md:block" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell />
            <BetaFeedbackButton />
            {isPlatformAdmin && (
              <NavLink
                to="/platform"
                className={({ isActive }) =>
                  cn('rounded p-2 hover:bg-muted', isActive && 'bg-muted text-primary')
                }
                title="Admin plataforma"
              >
                <Shield className="h-4 w-4" />
              </NavLink>
            )}
            <button onClick={toggleTheme} className="rounded p-2 transition-colors duration-300 ease-in-out hover:bg-muted">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn('rounded p-2 hover:bg-muted', isActive && 'bg-muted text-primary')
              }
              title="Configuración"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </div>
        </header>
        <main className={cn('flex-1 p-6', density === 'compact' && '[&_td]:py-2 [&_th]:py-2')}>
          <PermissionRoute>
            <Suspense fallback={<div className="flex justify-center py-16"><Loader /></div>}>
              <Outlet />
            </Suspense>
          </PermissionRoute>
        </main>
        <footer className="app-chrome border-t border-border px-6 py-3 text-xs text-muted-foreground">
          Domo © 2026
        </footer>
      </div>
    </div>
  );
}
