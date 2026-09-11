import type { Fill, Font, Borders, Alignment } from 'exceljs';

/** Paleta Domo (light theme) — alineada con globals.css */
export const DOMO = {
  primary: 'FF438976',
  primaryDark: 'FF2F6B5A',
  primaryFg: 'FFFDFCF9',
  headerBg: 'FFE8F0EC',
  sectionBg: 'FFF4F7F5',
  border: 'FFD4DFDA',
  text: 'FF333B47',
  muted: 'FF6B7280',
  white: 'FFFFFFFF',
  accent: 'FFF5EBE8',
} as const;

export interface ReportExportContext {
  companyName: string;
  from?: string;
  to?: string;
  generatedAt?: Date;
}

export function formatExportDate(value?: string) {
  if (!value) return '—';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatGeneratedAt(date = new Date()) {
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function periodLabel(ctx: ReportExportContext) {
  return `${formatExportDate(ctx.from)} — ${formatExportDate(ctx.to)}`;
}

const solidFill = (argb: string): Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

export const excelStyles = {
  brandTitle: {
    font: { bold: true, size: 18, color: { argb: DOMO.primaryFg }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.primary),
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 } as Alignment,
  },
  brandSubtitle: {
    font: { size: 11, color: { argb: DOMO.primaryFg }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.primaryDark),
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 } as Alignment,
  },
  metaLabel: {
    font: { bold: true, size: 10, color: { argb: DOMO.muted }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.white),
  },
  metaValue: {
    font: { size: 10, color: { argb: DOMO.text }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.white),
  },
  sectionTitle: {
    font: { bold: true, size: 12, color: { argb: DOMO.primaryDark }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.sectionBg),
    alignment: { vertical: 'middle', indent: 1 } as Alignment,
  },
  tableHeader: {
    font: { bold: true, size: 10, color: { argb: DOMO.primaryFg }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.primary),
    alignment: { vertical: 'middle', horizontal: 'center' } as Alignment,
    border: {
      top: { style: 'thin', color: { argb: DOMO.primaryDark } },
      bottom: { style: 'thin', color: { argb: DOMO.primaryDark } },
      left: { style: 'thin', color: { argb: DOMO.primaryDark } },
      right: { style: 'thin', color: { argb: DOMO.primaryDark } },
    } as Borders,
  },
  tableCell: {
    font: { size: 10, color: { argb: DOMO.text }, name: 'Calibri' } as Font,
    border: {
      top: { style: 'thin', color: { argb: DOMO.border } },
      bottom: { style: 'thin', color: { argb: DOMO.border } },
      left: { style: 'thin', color: { argb: DOMO.border } },
      right: { style: 'thin', color: { argb: DOMO.border } },
    } as Borders,
  },
  tableCellAlt: {
    font: { size: 10, color: { argb: DOMO.text }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.headerBg),
    border: {
      top: { style: 'thin', color: { argb: DOMO.border } },
      bottom: { style: 'thin', color: { argb: DOMO.border } },
      left: { style: 'thin', color: { argb: DOMO.border } },
      right: { style: 'thin', color: { argb: DOMO.border } },
    } as Borders,
  },
  kpiLabel: {
    font: { size: 10, color: { argb: DOMO.muted }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.white),
  },
  kpiValue: {
    font: { bold: true, size: 11, color: { argb: DOMO.text }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.white),
  },
  footer: {
    font: { italic: true, size: 9, color: { argb: DOMO.muted }, name: 'Calibri' } as Font,
    fill: solidFill(DOMO.sectionBg),
    alignment: { horizontal: 'center' } as Alignment,
  },
};

/** Formato numérico para Excel en locale español */
export const MONEY_FMT = '#.##0,00" €"';
export const INT_FMT = '#.##0';
export const PCT_FMT = '0,00"%"';

export function csvBrandHeader(title: string, ctx: ReportExportContext) {
  const lines = [
    'DOMO ERP',
    ctx.companyName,
    title,
    `Periodo: ${periodLabel(ctx)}`,
    `Generado: ${formatGeneratedAt(ctx.generatedAt)}`,
    '────────────────────────────────────────',
    '',
  ];
  return lines.join('\n');
}

export function csvSection(title: string) {
  return `\n${title.toUpperCase()}\n`;
}
