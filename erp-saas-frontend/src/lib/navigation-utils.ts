import { menuItems } from '@/config/menu.config';
import { planIncludesFeature } from '@/config/plan-features.config';
import { isMenuGroup, type MenuGroupItem, type MenuItem } from '@/types/menu.types';
import type { NavigationPrefs } from '@/types/navigation.types';

export function getTopLevelMenuIds(): string[] {
  return menuItems.map((item) => item.id);
}

export function getNavigationMenuEntries(): {
  id: string;
  label: string;
  planFeature?: string | null;
  children: { id: string; label: string }[];
}[] {
  return menuItems.map((item) => ({
    id: item.id,
    label: item.label,
    planFeature: isMenuGroup(item) ? item.planFeature : item.planFeature,
    children: isMenuGroup(item)
      ? item.children.map((c) => ({ id: c.id, label: c.label }))
      : [],
  }));
}

function sortByOrder<T extends { id: string }>(items: T[], order?: string[]): T[] {
  if (!order?.length) return items;
  const index = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = index.get(a.id) ?? 999;
    const bi = index.get(b.id) ?? 999;
    return ai - bi;
  });
}

function isHidden(id: string, hidden?: Set<string>) {
  return hidden?.has(id) ?? false;
}

export function applyNavigationPrefs(
  items: MenuItem[],
  prefs: NavigationPrefs | undefined,
  planFeatures: Record<string, boolean> | undefined,
  canAccess: (permission?: string) => boolean,
): MenuItem[] {
  const hidden = new Set(prefs?.hiddenIds ?? []);

  const filtered = items
    .filter((item) => !isHidden(item.id, hidden))
    .map((item) => {
      const planFeature = isMenuGroup(item) ? item.planFeature : item.planFeature;
      if (!planIncludesFeature(planFeatures, planFeature)) return null;

      if (isMenuGroup(item)) {
        const childOrder = prefs?.childOrder?.[item.id];
        const children = sortByOrder(item.children, childOrder)
          .filter((c) => canAccess(c.permission))
          .filter((c) => !isHidden(c.id, hidden));
        if (children.length === 0) return null;
        return { ...item, children } satisfies MenuGroupItem;
      }

      if (item.permission && !canAccess(item.permission)) return null;
      return item;
    })
    .filter(Boolean) as MenuItem[];

  return sortByOrder(filtered, prefs?.itemOrder);
}

export function defaultNavigationPrefs(): NavigationPrefs {
  return {
    itemOrder: getTopLevelMenuIds(),
    hiddenIds: [],
    childOrder: Object.fromEntries(
      menuItems
        .filter(isMenuGroup)
        .map((g) => [g.id, g.children.map((c) => c.id)]),
    ),
  };
}

export function mergeNavigationPrefs(prefs?: NavigationPrefs): NavigationPrefs {
  const defaults = defaultNavigationPrefs();
  return {
    itemOrder: prefs?.itemOrder?.length ? prefs.itemOrder : defaults.itemOrder,
    hiddenIds: prefs?.hiddenIds ?? [],
    childOrder: { ...defaults.childOrder, ...prefs?.childOrder },
  };
}
