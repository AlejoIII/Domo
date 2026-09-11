import type { LucideIcon } from 'lucide-react';

export interface MenuLinkItem {
  id: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  /** Permiso necesario para ver el ítem (ej. clients.read) */
  permission?: string;
  /** Si se define, el ítem hereda la feature del grupo padre */
  customizable?: boolean;
}

export interface MenuGroupItem {
  id: string;
  label: string;
  icon: LucideIcon;
  children: MenuLinkItem[];
  /** Feature de plan requerida (null = todos los planes) */
  planFeature?: string | null;
  customizable?: boolean;
}

export interface MenuSingleItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  planFeature?: string | null;
  customizable?: boolean;
}

export type MenuItem = MenuSingleItem | MenuGroupItem;

export function isMenuGroup(item: MenuItem): item is MenuGroupItem {
  return 'children' in item;
}
