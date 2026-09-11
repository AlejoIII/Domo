import { useMemo } from 'react';
import { menuItems } from '@/config/menu.config';
import { applyNavigationPrefs } from '@/lib/navigation-utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigationPrefs } from '@/hooks/useNavigationPrefs';
import type { NavigationPrefs } from '@/types/navigation.types';

function useCanAccessMenu() {
  const { permissions, roleName, roleId, isAdmin } = usePermissions();

  return useMemo(
    () => (permission?: string) => {
      if (!permission) return true;
      if (isAdmin) return true;
      if (!roleId) return true;
      if (!roleName && permissions.length === 0) return true;
      return permissions.includes(permission);
    },
    [permissions, roleName, roleId, isAdmin],
  );
}

export function useVisibleMenuItems() {
  const canAccess = useCanAccessMenu();
  const { prefs, planFeatures, isLoading } = useNavigationPrefs();

  const visibleItems = useMemo(
    () => applyNavigationPrefs(menuItems, prefs, planFeatures, canAccess),
    [canAccess, prefs, planFeatures],
  );

  return { visibleItems, isLoading, planFeatures };
}

export function useVisibleMenuItemsFromPrefs(
  prefs: NavigationPrefs | undefined,
  planFeatures: Record<string, boolean> | undefined,
) {
  const canAccess = useCanAccessMenu();

  return useMemo(
    () => applyNavigationPrefs(menuItems, prefs, planFeatures, canAccess),
    [canAccess, prefs, planFeatures],
  );
}
