import { createHash } from 'crypto';

/**
 * Campos de un registro de alta usados para la huella (OM HAC/1177/2024).
 * Formato de concatenación: clave=valor unidos por `&` en UTF-8 → SHA-256 hex.
 * Validar contra vectores oficiales AEAT antes de certificación.
 */
export interface VerifactuAltaHashInput {
  idEmisorFactura: string;
  numSerieFactura: string;
  /** DD-MM-YYYY */
  fechaExpedicionFactura: string;
  tipoFactura: string;
  /** Decimal con punto, 2 decimales */
  cuotaTotal: string;
  importeTotal: string;
  /** Huella del registro anterior; cadena vacía si es el primero */
  huellaAnterior: string;
  /** ISO-8601 con offset, p.ej. 2024-09-13T19:20:30+02:00 */
  fechaHoraHusoGenRegistro: string;
}

export interface VerifactuAnulacionHashInput {
  idEmisorFactura: string;
  numSerieFactura: string;
  fechaExpedicionFactura: string;
  huellaAnterior: string;
  fechaHoraHusoGenRegistro: string;
}

export function formatMoneyForHash(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) {
    throw new Error(`Importe inválido para huella Verifactu: ${value}`);
  }
  return n.toFixed(2);
}

export function formatFechaExpedicion(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Fecha/hora con huso para FechaHoraHusoGenRegistro (Europe/Madrid aproximado vía offset). */
export function formatFechaHoraHuso(date = new Date(), timeZone = 'Europe/Madrid'): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const y = get('year');
  const m = get('month');
  const d = get('day');
  const h = get('hour');
  const min = get('minute');
  const s = get('second');

  const offset = getMadridOffset(date);
  return `${y}-${m}-${d}T${h}:${min}:${s}${offset}`;
}

function getMadridOffset(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    timeZoneName: 'shortOffset',
  });
  const tz = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value;
  // "GMT+2" | "GMT+1" | "GMT+01:00"
  if (!tz) return '+01:00';
  const match = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return '+01:00';
  const sign = match[1];
  const hours = match[2].padStart(2, '0');
  const mins = (match[3] ?? '00').padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

export function buildAltaHashPayload(input: VerifactuAltaHashInput): string {
  return [
    `IDEmisorFactura=${input.idEmisorFactura}`,
    `NumSerieFactura=${input.numSerieFactura}`,
    `FechaExpedicionFactura=${input.fechaExpedicionFactura}`,
    `TipoFactura=${input.tipoFactura}`,
    `CuotaTotal=${input.cuotaTotal}`,
    `ImporteTotal=${input.importeTotal}`,
    `Huella=${input.huellaAnterior}`,
    `FechaHoraHusoGenRegistro=${input.fechaHoraHusoGenRegistro}`,
  ].join('&');
}

export function buildAnulacionHashPayload(input: VerifactuAnulacionHashInput): string {
  return [
    `IDEmisorFactura=${input.idEmisorFactura}`,
    `NumSerieFactura=${input.numSerieFactura}`,
    `FechaExpedicionFactura=${input.fechaExpedicionFactura}`,
    `Huella=${input.huellaAnterior}`,
    `FechaHoraHusoGenRegistro=${input.fechaHoraHusoGenRegistro}`,
  ].join('&');
}

export function sha256Hex(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function computeAltaHuella(input: VerifactuAltaHashInput): string {
  return sha256Hex(buildAltaHashPayload(input));
}

export function computeAnulacionHuella(input: VerifactuAnulacionHashInput): string {
  return sha256Hex(buildAnulacionHashPayload(input));
}
