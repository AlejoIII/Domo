import {
  User,
  Mail,
  Settings,
  AlertTriangle,
  Lightbulb,
  ListTodo,
  Calendar,
  Tag,
  Link2,
  Kanban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CrmCatalogCategory } from '@/types/crm-config.types';

export interface CrmSettingsLink {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
}

export interface CrmCatalogRoute {
  id: string;
  label: string;
  category: CrmCatalogCategory;
  to: string;
  icon: LucideIcon;
}

export const CRM_CATALOG_ROUTES: CrmCatalogRoute[] = [
  { id: 'subjects', label: 'Asuntos', category: 'subject', to: '/crm/settings/catalog/subject', icon: User },
  {
    id: 'agenda',
    label: 'Clasificación agenda',
    category: 'agenda_classification',
    to: '/crm/settings/catalog/agenda_classification',
    icon: Calendar,
  },
  { id: 'statuses', label: 'Estados', category: 'status', to: '/crm/settings/catalog/status', icon: Tag },
  {
    id: 'task-situations',
    label: 'Situaciones de tarea',
    category: 'task_situation',
    to: '/crm/settings/catalog/task_situation',
    icon: ListTodo,
  },
  {
    id: 'incident-types',
    label: 'Tipos de incidencias',
    category: 'incident_type',
    to: '/crm/settings/catalog/incident_type',
    icon: AlertTriangle,
  },
  {
    id: 'suggestion-types',
    label: 'Tipos de sugerencia',
    category: 'suggestion_type',
    to: '/crm/settings/catalog/suggestion_type',
    icon: Lightbulb,
  },
  {
    id: 'task-types',
    label: 'Tipos de tarea',
    category: 'task_type',
    to: '/crm/settings/catalog/task_type',
    icon: ListTodo,
  },
];

export const CRM_SETTINGS_LINKS: CrmSettingsLink[] = [
  {
    id: 'pipeline-stages',
    label: 'Etapas pipeline',
    to: '/crm/settings/stages',
    icon: Kanban,
    description: 'Columnas del kanban y etapas de cierre',
  },
  ...CRM_CATALOG_ROUTES.map(({ id, label, to, icon }) => ({
    id,
    label,
    to,
    icon,
  })),
  {
    id: 'templates',
    label: 'Plantillas email',
    to: '/crm/settings/templates',
    icon: Mail,
    description: 'Plantillas HTML para comunicaciones del CRM',
  },
  {
    id: 'email-settings',
    label: 'Configuración emails',
    to: '/crm/settings/email',
    icon: Settings,
    description: 'Remitente, firma y plantilla por defecto',
  },
  {
    id: 'acrelia',
    label: 'Cuentas Acrelia',
    to: '/crm/settings/acrelia',
    icon: Link2,
    description: 'Integración SMS / email marketing Acrelia',
  },
];

export const CRM_CATALOG_LABELS: Record<CrmCatalogCategory, string> = {
  subject: 'Asuntos',
  agenda_classification: 'Clasificación agenda',
  status: 'Estados',
  task_situation: 'Situaciones de tarea',
  incident_type: 'Tipos de incidencias',
  suggestion_type: 'Tipos de sugerencia',
  task_type: 'Tipos de tarea',
};

/** Ejemplo de nombre por catálogo, para orientar al crear una opción nueva. */
export const CRM_CATALOG_NAME_EXAMPLES: Record<CrmCatalogCategory, string> = {
  subject: 'Reclamación',
  agenda_classification: 'Visita comercial',
  status: 'Pendiente de respuesta',
  task_situation: 'En curso',
  incident_type: 'Producto defectuoso',
  suggestion_type: 'Mejora de producto',
  task_type: 'Llamada de seguimiento',
};

export function getCatalogMeta(category: string) {
  return CRM_CATALOG_ROUTES.find((item) => item.category === category)
    ?? CRM_CATALOG_ROUTES[0];
}
