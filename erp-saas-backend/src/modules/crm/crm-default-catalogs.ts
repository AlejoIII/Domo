import { CrmCatalogCategory } from './crm-config.constants';

export interface DefaultCatalogItem {
  name: string;
  code?: string;
  color?: string;
  sortOrder: number;
}

export const DEFAULT_CRM_CATALOGS: Record<CrmCatalogCategory, DefaultCatalogItem[]> = {
  subject: [
    { name: 'Seguimiento comercial', code: 'follow_up', sortOrder: 1 },
    { name: 'Información', code: 'info', sortOrder: 2 },
    { name: 'Reclamación', code: 'claim', sortOrder: 3 },
  ],
  agenda_classification: [
    { name: 'Visita', code: 'visit', color: '#6366f1', sortOrder: 1 },
    { name: 'Llamada', code: 'call', color: '#0ea5e9', sortOrder: 2 },
    { name: 'Reunión', code: 'meeting', color: '#22c55e', sortOrder: 3 },
    { name: 'Recordatorio', code: 'reminder', color: '#f59e0b', sortOrder: 4 },
  ],
  status: [
    { name: 'Nuevo', code: 'new', color: '#6366f1', sortOrder: 1 },
    { name: 'Contactado', code: 'contacted', color: '#0ea5e9', sortOrder: 2 },
    { name: 'Calificado', code: 'qualified', color: '#22c55e', sortOrder: 3 },
    { name: 'Convertido', code: 'converted', color: '#16a34a', sortOrder: 4 },
    { name: 'Descartado', code: 'disqualified', color: '#ef4444', sortOrder: 5 },
  ],
  task_situation: [
    { name: 'Pendiente', code: 'pending', color: '#f59e0b', sortOrder: 1 },
    { name: 'En curso', code: 'in_progress', color: '#0ea5e9', sortOrder: 2 },
    { name: 'Bloqueada', code: 'blocked', color: '#ef4444', sortOrder: 3 },
    { name: 'Completada', code: 'done', color: '#22c55e', sortOrder: 4 },
  ],
  incident_type: [
    { name: 'Incidencia técnica', code: 'technical', sortOrder: 1 },
    { name: 'Incidencia comercial', code: 'commercial', sortOrder: 2 },
    { name: 'Incidencia logística', code: 'logistics', sortOrder: 3 },
  ],
  suggestion_type: [
    { name: 'Mejora de producto', code: 'product', sortOrder: 1 },
    { name: 'Mejora de servicio', code: 'service', sortOrder: 2 },
    { name: 'Nueva funcionalidad', code: 'feature', sortOrder: 3 },
  ],
  task_type: [
    { name: 'Llamada', code: 'call', sortOrder: 1 },
    { name: 'Reunión', code: 'meeting', sortOrder: 2 },
    { name: 'Tarea', code: 'task', sortOrder: 3 },
    { name: 'Email', code: 'email', sortOrder: 4 },
  ],
};
