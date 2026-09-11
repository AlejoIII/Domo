import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { isMenuGroup, type MenuGroupItem, type MenuItem } from '@/types/menu.types';
import { useVisibleMenuItems } from '@/hooks/useVisibleMenuItems';
import { useSidebarStore } from '@/store/sidebar.store';
import { cn } from '@/lib/cn';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-300 ease-in-out',
    isActive
      ? 'bg-primary/90 text-primary-foreground shadow-soft'
      : 'text-foreground/80 hover:bg-muted/80',
  );

const subLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg py-1.5 pl-9 pr-3 text-sm transition-colors duration-300 ease-in-out',
    isActive
      ? 'bg-primary/15 font-medium text-primary'
      : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
  );

function isChildRouteActive(pathname: string, routeTo: string, siblingRoutes: string[]) {
  const matches = pathname === routeTo || pathname.startsWith(`${routeTo}/`);
  if (!matches) return false;

  const hasMoreSpecificMatch = siblingRoutes.some(
    (other) =>
      other !== routeTo
      && other.length > routeTo.length
      && other.startsWith(`${routeTo}/`)
      && (pathname === other || pathname.startsWith(`${other}/`)),
  );

  return !hasMoreSpecificMatch;
}

function groupIsActive(group: MenuGroupItem, pathname: string) {
  const siblingRoutes = group.children.map((child) => child.to);
  return group.children.some((child) =>
    isChildRouteActive(pathname, child.to, siblingRoutes),
  );
}

function MenuGroup({
  item,
  collapsed,
  open,
  onToggle,
}: {
  item: MenuGroupItem;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const siblingRoutes = item.children.map((child) => child.to);
  const active = groupIsActive(item, location.pathname);
  const Icon = item.icon;
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  if (collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          type="button"
          title={item.label}
          onClick={onToggle}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-3 py-2 transition-colors duration-300 ease-in-out',
            active ? 'bg-primary/90 text-primary-foreground shadow-soft' : 'hover:bg-muted/80',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
        </button>

        {flyoutOpen && (
          <div className="absolute left-full top-0 z-50 ml-2 min-w-44 rounded-lg border border-border/70 bg-card p-2 shadow-card">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{item.label}</p>
            {item.children.map((child) => (
              <Link
                key={child.id}
                to={child.to}
                className={subLinkClass({
                  isActive: isChildRouteActive(location.pathname, child.to, siblingRoutes),
                })}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-300 ease-in-out',
          active ? 'text-primary' : 'text-foreground/80 hover:bg-muted/80',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300 ease-in-out', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <Link
              key={child.id}
              to={child.to}
              className={subLinkClass({
                isActive: isChildRouteActive(location.pathname, child.to, siblingRoutes),
              })}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getInitialOpenGroups(pathname: string, items: MenuItem[]): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  for (const item of items) {
    if (isMenuGroup(item) && groupIsActive(item, pathname)) {
      open[item.id] = true;
    }
  }
  return open;
}

export function SidebarNav() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const location = useLocation();
  const { visibleItems } = useVisibleMenuItems();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenGroups(location.pathname, visibleItems),
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of visibleItems) {
        if (isMenuGroup(item) && groupIsActive(item, location.pathname) && !next[item.id]) {
          next[item.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname, visibleItems]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {visibleItems.map((item: MenuItem) => {
        if (isMenuGroup(item)) {
          return (
            <MenuGroup
              key={item.id}
              item={item}
              collapsed={collapsed}
              open={!!openGroups[item.id]}
              onToggle={() => toggleGroup(item.id)}
            />
          );
        }

        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(linkClass({ isActive }), collapsed && 'justify-center px-3')
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
