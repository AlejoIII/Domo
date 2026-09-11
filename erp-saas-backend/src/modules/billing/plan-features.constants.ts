/** Códigos persistidos en BD (`pro` = Premium en UI) */
export const PLAN_CODES = {
  FREE: 'free',
  PREMIUM: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const PLAN_FEATURE_KEYS = {
  reports: 'reports',
  accounting: 'accounting',
  crm: 'crm',
  treasury: 'treasury',
  hr: 'hr',
  projects: 'projects',
  manufacturing: 'manufacturing',
  attachments: 'attachments',
  webhooks: 'webhooks',
  api: 'api',
  appearance: 'appearance',
  ads: 'ads',
  pdfWatermark: 'pdfWatermark',
} as const;

export type PlanFeatureKey = keyof typeof PLAN_FEATURE_KEYS;

export type PlanFeatures = Record<string, boolean>;

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

export const DEFAULT_PLAN_FEATURES: Record<string, PlanFeatures> = {
  [PLAN_CODES.FREE]: {
    reports: false,
    accounting: false,
    crm: false,
    treasury: false,
    hr: false,
    projects: false,
    manufacturing: false,
    attachments: true,
    webhooks: false,
    api: false,
    appearance: false,
    ads: true,
    pdfWatermark: true,
  },
  [PLAN_CODES.PREMIUM]: {
    reports: true,
    accounting: true,
    crm: true,
    treasury: true,
    hr: true,
    projects: false,
    manufacturing: false,
    attachments: true,
    webhooks: true,
    api: false,
    appearance: true,
    ads: false,
    pdfWatermark: false,
  },
  [PLAN_CODES.ENTERPRISE]: {
    reports: true,
    accounting: true,
    crm: true,
    treasury: true,
    hr: true,
    projects: true,
    manufacturing: true,
    attachments: true,
    webhooks: true,
    api: true,
    appearance: true,
    ads: false,
    pdfWatermark: false,
  },
};

export const DEFAULT_PLAN_LIMITS = {
  [PLAN_CODES.FREE]: { name: 'Free', maxUsers: 3, maxDocuments: 50 as number | null },
  [PLAN_CODES.PREMIUM]: { name: 'Premium', maxUsers: 20, maxDocuments: 500 as number | null },
  [PLAN_CODES.ENTERPRISE]: { name: 'Enterprise', maxUsers: 999, maxDocuments: null as number | null },
};

/** Features efectivas durante trial: Premium sin marca Free */
export const TRIAL_PLAN_FEATURES: PlanFeatures = {
  ...DEFAULT_PLAN_FEATURES[PLAN_CODES.PREMIUM],
  ads: false,
  pdfWatermark: false,
};

export const PRINT_WATERMARK_TEXT = 'Generado con Domo Free — domo.app';

export const PDF_WATERMARK_UPGRADE_PLAN = 'Premium';
