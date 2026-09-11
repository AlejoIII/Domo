/** Claves de features de plan usadas por módulos del menú lateral */
export const MENU_PLAN_FEATURES = {
  reports: 'reports',
  accounting: 'accounting',
  crm: 'crm',
  treasury: 'treasury',
  projects: 'projects',
  manufacturing: 'manufacturing',
  hr: 'hr',
} as const;

export type MenuPlanFeature = (typeof MENU_PLAN_FEATURES)[keyof typeof MENU_PLAN_FEATURES];

/** id de grupo/item → feature de plan (null = incluido en todos los planes) */
export const MENU_ITEM_PLAN_FEATURE: Record<string, MenuPlanFeature | null> = {
  dashboard: null,
  sales: null,
  inventory: null,
  purchases: null,
  reports: 'reports',
  accounting: 'accounting',
  crm: 'crm',
  treasury: 'treasury',
  projects: 'projects',
  manufacturing: 'manufacturing',
  hr: 'hr',
};

export const VALID_TOP_LEVEL_MENU_IDS = Object.keys(MENU_ITEM_PLAN_FEATURE);

export const VALID_MENU_IDS = new Set<string>([
  ...VALID_TOP_LEVEL_MENU_IDS,
  'clients', 'orders', 'invoices', 'quotes',
  'products', 'categories', 'warehouses', 'stock-movements',
  'suppliers', 'purchase-orders',
  'sales-report', 'finance-report', 'stock-valuation',
  'accounting-main',
  'crm-main', 'crm-settings',
  'treasury-main',
  'projects-main',
  'manufacturing-main',
  'employees',
]);

export interface NavigationPrefs {
  itemOrder?: string[];
  hiddenIds?: string[];
  childOrder?: Record<string, string[]>;
}

export const DEFAULT_NAVIGATION_PREFS: NavigationPrefs = {};

export function planHasFeature(
  features: Record<string, boolean>,
  feature: MenuPlanFeature | null,
): boolean {
  if (!feature) return true;
  return features[feature] === true;
}

export function sanitizeNavigationPrefs(
  input: NavigationPrefs,
  _features: Record<string, boolean>,
): NavigationPrefs {
  const itemOrder = (input.itemOrder ?? [])
    .filter((id) => VALID_TOP_LEVEL_MENU_IDS.includes(id));

  const hiddenIds = (input.hiddenIds ?? [])
    .filter((id) => VALID_MENU_IDS.has(id));

  const childOrder: Record<string, string[]> = {};
  if (input.childOrder) {
    for (const [groupId, ids] of Object.entries(input.childOrder)) {
      if (!VALID_TOP_LEVEL_MENU_IDS.includes(groupId)) continue;
      childOrder[groupId] = ids.filter((id) => VALID_MENU_IDS.has(id));
    }
  }

  return {
    itemOrder: itemOrder.length ? itemOrder : undefined,
    hiddenIds: hiddenIds.length ? hiddenIds : undefined,
    childOrder: Object.keys(childOrder).length ? childOrder : undefined,
  };
}
