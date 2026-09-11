/** Features de plan que desbloquean módulos del menú */
export const PLAN_FEATURE_LABELS: Record<string, string> = {
  reports: 'Informes',
  accounting: 'Contabilidad',
  crm: 'CRM',
  treasury: 'Tesorería',
  projects: 'Proyectos',
  manufacturing: 'Fabricación',
  hr: 'RRHH',
  api: 'API pública',
  webhooks: 'Webhooks',
  appearance: 'Personalización de apariencia',
  ads: 'Experiencia Free',
  pdfWatermark: 'Marca de agua en PDFs',
};

export const PLAN_UPGRADE_HINT: Record<string, string> = {
  reports: 'Premium',
  accounting: 'Premium',
  crm: 'Premium',
  treasury: 'Premium',
  hr: 'Premium',
  webhooks: 'Premium',
  appearance: 'Premium',
  projects: 'Enterprise',
  manufacturing: 'Enterprise',
  api: 'Enterprise',
};

export function planIncludesFeature(
  features: Record<string, boolean> | undefined,
  feature?: string | null,
): boolean {
  if (!feature) return true;
  return features?.[feature] === true;
}

export function planShowsAds(features: Record<string, boolean> | undefined): boolean {
  return features?.ads === true;
}

export function planUsesPdfWatermark(features: Record<string, boolean> | undefined): boolean {
  return features?.pdfWatermark === true;
}

/** Texto de marca de agua para exportaciones PDF (cuando se implementen) */
export const FREE_PDF_WATERMARK = 'Generado con Domo Free — domo.app';
