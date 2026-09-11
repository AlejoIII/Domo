/** Datos legales configurables en build (Vite). Sin valores = aviso de borrador. */

export interface LegalEntity {
  companyName: string;
  address: string;
  privacyEmail: string;
  supportEmail: string;
  cif?: string;
  isConfigured: boolean;
}

export function getLegalEntity(): LegalEntity {
  const companyName = (import.meta.env.VITE_LEGAL_COMPANY_NAME as string | undefined)?.trim() ?? '';
  const address = (import.meta.env.VITE_LEGAL_ADDRESS as string | undefined)?.trim() ?? '';
  const privacyEmail =
    (import.meta.env.VITE_LEGAL_PRIVACY_EMAIL as string | undefined)?.trim()
    || (import.meta.env.VITE_LEGAL_SUPPORT_EMAIL as string | undefined)?.trim()
    || '';
  const supportEmail =
    (import.meta.env.VITE_LEGAL_SUPPORT_EMAIL as string | undefined)?.trim()
    || privacyEmail;
  const cif = (import.meta.env.VITE_LEGAL_CIF as string | undefined)?.trim() || undefined;

  const isConfigured = Boolean(companyName && address && privacyEmail);

  return {
    companyName: companyName || 'Domo (borrador — configura VITE_LEGAL_COMPANY_NAME)',
    address: address || 'Dirección pendiente de configurar (VITE_LEGAL_ADDRESS)',
    privacyEmail: privacyEmail || 'privacidad@ejemplo.com',
    supportEmail: supportEmail || 'soporte@ejemplo.com',
    cif,
    isConfigured,
  };
}
