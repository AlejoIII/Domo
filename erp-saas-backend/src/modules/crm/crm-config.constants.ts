export const CRM_CATALOG_CATEGORIES = [
  'subject',
  'agenda_classification',
  'status',
  'task_situation',
  'incident_type',
  'suggestion_type',
  'task_type',
] as const;

export type CrmCatalogCategory = (typeof CRM_CATALOG_CATEGORIES)[number];

export const CRM_CATALOG_LABELS: Record<CrmCatalogCategory, string> = {
  subject: 'Asuntos',
  agenda_classification: 'Clasificación agenda',
  status: 'Estados',
  task_situation: 'Situaciones de tarea',
  incident_type: 'Tipos de incidencias',
  suggestion_type: 'Tipos de sugerencia',
  task_type: 'Tipos de tarea',
};

export function isCrmCatalogCategory(value: string): value is CrmCatalogCategory {
  return (CRM_CATALOG_CATEGORIES as readonly string[]).includes(value);
}
