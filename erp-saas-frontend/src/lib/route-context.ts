import { menuItems } from '@/config/menu.config';
import { entities } from '@/config/entities.config';
import { CRM_SETTINGS_LINKS } from '@/config/crm-settings.config';
import { isMenuGroup } from '@/types/menu.types';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface QuickSearchEntry {
  id: string;
  label: string;
  to: string;
  group: string;
  keywords: string;
}

const SETTINGS_TAB_LABELS: Record<string, string> = {
  profile: 'Perfil',
  company: 'Empresa',
  documents: 'Documentos',
  forms: 'Fichas',
  roles: 'Roles',
  audit: 'Auditoría',
  appearance: 'Apariencia',
  navigation: 'Navegación',
  notifications: 'Avisos',
  billing: 'Plan y facturación',
  integrations: 'Integraciones',
  security: 'Seguridad',
};

const PLATFORM_ROUTES: Record<string, string> = {
  '/platform': 'Resumen',
  '/platform/companies': 'Empresas',
  '/platform/users': 'Usuarios',
  '/platform/billing': 'Facturación',
  '/platform/system': 'Sistema',
};

interface RouteMeta {
  group?: string;
  label: string;
}

function buildRouteMetaMap(): Map<string, RouteMeta> {
  const map = new Map<string, RouteMeta>();

  for (const item of menuItems) {
    if (isMenuGroup(item)) {
      for (const child of item.children) {
        map.set(child.to, { group: item.label, label: child.label });
      }
    } else if ('to' in item) {
      map.set(item.to, { label: item.label });
    }
  }

  map.set('/settings', { label: 'Configuración' });

  return map;
}

const routeMeta = buildRouteMetaMap();

function matchEntityBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  for (const entity of Object.values(entities)) {
    const base = entity.basePath;
    if (!pathname.startsWith(base)) continue;

    const meta = routeMeta.get(base);
    const crumbs: BreadcrumbItem[] = [];

    if (meta?.group) {
      crumbs.push({ label: meta.group });
    }
    crumbs.push({ label: entity.plural, to: base });

    const rest = pathname.slice(base.length);
    if (!rest || rest === '/') return crumbs;
    if (rest === '/new') {
      crumbs.push({ label: 'Nuevo' });
      return crumbs;
    }
    if (/^\/[^/]+$/.test(rest)) {
      crumbs.push({ label: 'Ficha' });
      return crumbs;
    }
    if (rest.endsWith('/delivery-note/print')) {
      crumbs.push({ label: 'Albarán' });
      return crumbs;
    }
    if (rest.endsWith('/print')) {
      crumbs.push({ label: 'Imprimir' });
      return crumbs;
    }
  }

  return null;
}

function matchPlatformBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  if (!pathname.startsWith('/platform')) return null;

  const crumbs: BreadcrumbItem[] = [{ label: 'Admin plataforma', to: '/platform' }];

  if (pathname === '/platform') return crumbs;

  const exact = PLATFORM_ROUTES[pathname];
  if (exact) {
    crumbs.push({ label: exact });
    return crumbs;
  }

  if (/^\/platform\/companies\/[^/]+$/.test(pathname)) {
    crumbs.push({ label: 'Empresas', to: '/platform/companies' });
    crumbs.push({ label: 'Detalle' });
    return crumbs;
  }

  return crumbs;
}

export function getBreadcrumbs(pathname: string, searchParams: URLSearchParams): BreadcrumbItem[] {
  const path = pathname === '/' ? '/dashboard' : pathname;

  if (path === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  if (path === '/settings') {
    const crumbs: BreadcrumbItem[] = [{ label: 'Configuración', to: '/settings' }];
    const tab = searchParams.get('tab');
    if (tab && SETTINGS_TAB_LABELS[tab]) {
      crumbs.push({ label: SETTINGS_TAB_LABELS[tab] });
    }
    return crumbs;
  }

  if (path.startsWith('/crm/settings')) {
    const crumbs: BreadcrumbItem[] = [
      { label: 'CRM', to: '/crm' },
      { label: 'Configuración', to: '/crm/settings' },
    ];
    const link = CRM_SETTINGS_LINKS.find((item) => path === item.to || path.startsWith(`${item.to}/`));
    if (link && path !== '/crm/settings') {
      crumbs.push({ label: link.label });
    }
    return crumbs;
  }

  const platform = matchPlatformBreadcrumbs(path);
  if (platform) return platform;

  const entity = matchEntityBreadcrumbs(path);
  if (entity) return entity;

  const meta = routeMeta.get(path);
  if (meta) {
    const crumbs: BreadcrumbItem[] = [];
    if (meta.group) crumbs.push({ label: meta.group });
    crumbs.push({ label: meta.label });
    return crumbs;
  }

  return [{ label: 'Inicio', to: '/dashboard' }];
}

export function buildQuickSearchEntries(): QuickSearchEntry[] {
  const entries: QuickSearchEntry[] = [];

  for (const item of menuItems) {
    if (isMenuGroup(item)) {
      for (const child of item.children) {
        entries.push({
          id: child.id,
          label: child.label,
          to: child.to,
          group: item.label,
          keywords: `${item.label} ${child.label}`.toLowerCase(),
        });
      }
    } else if ('to' in item) {
      entries.push({
        id: item.id,
        label: item.label,
        to: item.to,
        group: 'General',
        keywords: item.label.toLowerCase(),
      });
    }
  }

  for (const tab of Object.entries(SETTINGS_TAB_LABELS)) {
    entries.push({
      id: `settings-${tab[0]}`,
      label: tab[1],
      to: `/settings?tab=${tab[0]}`,
      group: 'Configuración',
      keywords: `configuración ${tab[1]}`.toLowerCase(),
    });
  }

  for (const entity of Object.values(entities)) {
    entries.push({
      id: `new-${entity.id}`,
      label: `Nuevo ${entity.singular.toLowerCase()}`,
      to: `${entity.basePath}/new`,
      group: 'Acciones rápidas',
      keywords: `nuevo crear ${entity.singular} ${entity.plural}`.toLowerCase(),
    });
  }

  return entries;
}

export function filterQuickSearchEntries(entries: QuickSearchEntry[], query: string): QuickSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries.slice(0, 8);

  return entries
    .filter((entry) => entry.keywords.includes(q) || entry.label.toLowerCase().includes(q))
    .slice(0, 8);
}
