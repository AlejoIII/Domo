/** Identificación del SIF Domo (fabricante). Ajustar NIF real antes de producción AEAT. */
export const DOMO_SIF = {
  nombreSistemaInformatico: 'Domo',
  idSistemaInformatico: '01',
  /** Placeholder — sustituir por NIF del productor del software */
  nifProductor: process.env.VERIFACTU_SOFTWARE_NIF ?? 'B00000000',
  version: process.env.VERIFACTU_SOFTWARE_VERSION ?? '1.0.0',
  numeroInstalacion: process.env.VERIFACTU_INSTALLATION_ID ?? '1',
  tipoUsoPosibleSoloVerifactu: 'S',
  tipoUsoPosibleMultiOT: 'S',
  indicadorMultiplesOT: 'S',
} as const;

export const VERIFACTU_RECORD_TYPE = {
  ALTA: 'alta',
  ANULACION: 'anulacion',
} as const;

export const VERIFACTU_AEAT_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  ACCEPTED_WITH_ERRORS: 'accepted_with_errors',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
  DRY_RUN: 'dry_run',
} as const;

/** URL base QR validación AEAT (producción). Pre: ver docs AEAT. */
export const VERIFACTU_QR_BASE_URL =
  'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR';
