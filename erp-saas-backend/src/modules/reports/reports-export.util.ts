import type ExcelJS from 'exceljs';
import {
  invoiceStatusLabelEs,
  orderStatusLabelEs,
  poStatusLabelEs,
} from './report-export-labels';
import {
  csvBrandHeader,
  csvSection,
  excelStyles,
  formatGeneratedAt,
  INT_FMT,
  MONEY_FMT,
  periodLabel,
  type ReportExportContext,
} from './report-export-theme';

function escapeCsv(value: unknown) {
  const text = value == null ? '' : String(value);
  if (/[",;\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function row(cells: unknown[]) {
  return `${cells.map(escapeCsv).join(';')}\n`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

function applyRowStyle(row: ExcelJS.Row, style: Partial<ExcelJS.Style>, colCount: number) {
  for (let col = 1; col <= colCount; col += 1) {
    row.getCell(col).style = style as ExcelJS.Style;
  }
}

function colLetter(index: number) {
  return String.fromCharCode(64 + index);
}

function styleBrandHeader(sheet: ExcelJS.Worksheet, title: string, ctx: ReportExportContext, colSpan: number) {
  const endCol = colLetter(colSpan);

  sheet.mergeCells(`A1:${endCol}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Domo · ${title}`;
  titleCell.style = excelStyles.brandTitle;
  sheet.getRow(1).height = 34;

  sheet.mergeCells(`A2:${endCol}2`);
  const subCell = sheet.getCell('A2');
  subCell.value = ctx.companyName;
  subCell.style = excelStyles.brandSubtitle;
  sheet.getRow(2).height = 22;

  sheet.addRow(['Periodo', periodLabel(ctx), 'Generado', formatGeneratedAt(ctx.generatedAt)]);
  const metaRow = sheet.getRow(3);
  metaRow.getCell(1).style = excelStyles.metaLabel;
  metaRow.getCell(2).style = excelStyles.metaValue;
  metaRow.getCell(3).style = excelStyles.metaLabel;
  metaRow.getCell(4).style = excelStyles.metaValue;
  metaRow.height = 20;

  sheet.addRow([]);
}

function addSectionTitle(sheet: ExcelJS.Worksheet, title: string, colSpan: number) {
  const endCol = colLetter(colSpan);
  const rowNum = sheet.lastRow ? sheet.lastRow.number + 1 : 1;
  sheet.mergeCells(`A${rowNum}:${endCol}${rowNum}`);
  const cell = sheet.getCell(`A${rowNum}`);
  cell.value = title;
  cell.style = excelStyles.sectionTitle;
  sheet.getRow(rowNum).height = 24;
}

function addTableHeader(sheet: ExcelJS.Worksheet, headers: string[]) {
  const headerRow = sheet.addRow(headers);
  applyRowStyle(headerRow, excelStyles.tableHeader, headers.length);
  headerRow.height = 22;
}

function addTableRow(
  sheet: ExcelJS.Worksheet,
  values: (string | number)[],
  options?: { moneyCols?: number[]; alt?: boolean },
) {
  const dataRow = sheet.addRow(values);
  const style = options?.alt ? excelStyles.tableCellAlt : excelStyles.tableCell;
  const colCount = values.length;
  applyRowStyle(dataRow, style, colCount);
  options?.moneyCols?.forEach((col) => {
    const cell = dataRow.getCell(col);
    cell.numFmt = MONEY_FMT;
  });
}

function addKpiRows(sheet: ExcelJS.Worksheet, rows: [string, string | number][]) {
  rows.forEach(([label, value]) => {
    const r = sheet.addRow([label, value]);
    r.getCell(1).style = excelStyles.kpiLabel;
    const valueCell = r.getCell(2);
    valueCell.style = excelStyles.kpiValue;
    if (typeof value === 'number') valueCell.numFmt = MONEY_FMT;
  });
}

function finishSheet(sheet: ExcelJS.Worksheet, colSpan: number, ctx: ReportExportContext) {
  sheet.addRow([]);
  const footerRowNum = sheet.lastRow!.number + 1;
  const endCol = colLetter(colSpan);
  sheet.mergeCells(`A${footerRowNum}:${endCol}${footerRowNum}`);
  const footer = sheet.getCell(`A${footerRowNum}`);
  footer.value = `Generado con Domo ERP · ${ctx.companyName}`;
  footer.style = excelStyles.footer;

  sheet.views = [{ state: 'frozen', ySplit: 3, showGridLines: false }];
}

function setupWorkbook(workbook: ExcelJS.Workbook, ctx: ReportExportContext, sheetName: string) {
  workbook.creator = 'Domo ERP';
  workbook.company = ctx.companyName;
  workbook.created = ctx.generatedAt ?? new Date();
  const sheet = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 18 },
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });
  return sheet;
}

export function buildSalesCsv(
  data: Awaited<ReturnType<import('./reports.service').ReportsService['sales']>>,
  ctx: ReportExportContext,
) {
  let csv = '\uFEFF';
  csv += csvBrandHeader('Informe de ventas', ctx);
  csv += csvSection('Resumen');
  csv += row(['Concepto', 'Valor']);
  csv += row(['Pedidos (cant.)', data.summary.ordersCount]);
  csv += row(['Pedidos (total)', formatMoney(data.summary.ordersTotal)]);
  csv += row(['Presupuestos (cant.)', data.summary.quotesCount]);
  csv += row(['Presupuestos (total)', formatMoney(data.summary.quotesTotal)]);
  csv += row(['Aceptados', data.summary.acceptedQuotes]);
  csv += row(['Conversión', `${data.summary.conversionRate}%`]);
  csv += csvSection('Pedidos por estado');
  csv += row(['Estado', 'Cantidad', 'Total']);
  for (const item of data.byStatus) {
    csv += row([orderStatusLabelEs(item.status), item.count, formatMoney(item.total)]);
  }
  csv += csvSection('Principales clientes');
  csv += row(['Cliente', 'Pedidos', 'Total']);
  for (const client of data.topClients) {
    csv += row([client.clientName, client.orders, formatMoney(client.total)]);
  }
  csv += `\nGenerado con Domo ERP · ${ctx.companyName}\n`;
  return csv;
}

export function buildFinanceCsv(
  data: Awaited<ReturnType<import('./reports.service').ReportsService['finance']>>,
  ctx: ReportExportContext,
) {
  let csv = '\uFEFF';
  csv += csvBrandHeader('Informe financiero', ctx);
  csv += csvSection('Resumen');
  csv += row(['Concepto', 'Valor']);
  csv += row(['Facturado', formatMoney(data.summary.billed)]);
  csv += row(['Cobrado', formatMoney(data.summary.collected)]);
  csv += row(['Pendiente de cobro', formatMoney(data.summary.outstanding)]);
  csv += row(['IVA repercutido', formatMoney(data.summary.taxCollected)]);
  csv += row(['Compras totales', formatMoney(data.summary.purchasesTotal)]);
  csv += row(['Compras recibidas', formatMoney(data.summary.purchasesReceived)]);
  csv += row(['Margen estimado', formatMoney(data.summary.margin)]);
  csv += csvSection('Facturas por estado');
  csv += row(['Estado', 'Cantidad', 'Total', 'IVA']);
  for (const item of data.invoicesByStatus) {
    csv += row([
      invoiceStatusLabelEs(item.status),
      item.count,
      formatMoney(item.total),
      formatMoney(item.tax),
    ]);
  }
  csv += csvSection('Órdenes de compra por estado');
  csv += row(['Estado', 'Cantidad', 'Total']);
  for (const item of data.purchasesByStatus) {
    csv += row([poStatusLabelEs(item.status), item.count, formatMoney(item.total)]);
  }
  csv += `\nGenerado con Domo ERP · ${ctx.companyName}\n`;
  return csv;
}

export async function buildSalesXlsx(
  data: Awaited<ReturnType<import('./reports.service').ReportsService['sales']>>,
  ctx: ReportExportContext,
) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = setupWorkbook(workbook, ctx, 'Ventas');
  const colSpan = 4;

  sheet.columns = [
    { width: 28 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  styleBrandHeader(sheet, 'Informe de ventas', ctx, colSpan);

  addSectionTitle(sheet, 'Resumen', colSpan);
  addKpiRows(sheet, [
    ['Pedidos', data.summary.ordersCount],
    ['Importe pedidos', data.summary.ordersTotal],
    ['Presupuestos', data.summary.quotesCount],
    ['Importe presupuestos', data.summary.quotesTotal],
    ['Presupuestos aceptados', data.summary.acceptedQuotes],
    ['Conversión', `${data.summary.conversionRate}%`],
  ]);
  sheet.addRow([]);

  addSectionTitle(sheet, 'Pedidos por estado', colSpan);
  addTableHeader(sheet, ['Estado', 'Cantidad', 'Total', '']);
  data.byStatus.forEach((item, i) => {
    addTableRow(sheet, [orderStatusLabelEs(item.status), item.count, item.total, ''], {
      moneyCols: [3],
      alt: i % 2 === 1,
    });
    sheet.getRow(sheet.lastRow!.number).getCell(2).numFmt = INT_FMT;
  });
  sheet.addRow([]);

  addSectionTitle(sheet, 'Principales clientes', colSpan);
  addTableHeader(sheet, ['Cliente', 'Pedidos', 'Total', '']);
  data.topClients.forEach((client, i) => {
    addTableRow(sheet, [client.clientName, client.orders, client.total, ''], {
      moneyCols: [3],
      alt: i % 2 === 1,
    });
    sheet.getRow(sheet.lastRow!.number).getCell(2).numFmt = INT_FMT;
  });

  finishSheet(sheet, colSpan, ctx);
  return workbook.xlsx.writeBuffer();
}

export async function buildFinanceXlsx(
  data: Awaited<ReturnType<import('./reports.service').ReportsService['finance']>>,
  ctx: ReportExportContext,
) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = setupWorkbook(workbook, ctx, 'Finanzas');
  const colSpan = 4;

  sheet.columns = [
    { width: 26 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  styleBrandHeader(sheet, 'Informe financiero', ctx, colSpan);

  addSectionTitle(sheet, 'Resumen', colSpan);
  addKpiRows(sheet, [
    ['Facturado', data.summary.billed],
    ['Cobrado', data.summary.collected],
    ['Pendiente de cobro', data.summary.outstanding],
    ['IVA repercutido', data.summary.taxCollected],
    ['Compras (todas)', data.summary.purchasesTotal],
    ['Compras recibidas', data.summary.purchasesReceived],
    ['Margen estimado', data.summary.margin],
  ]);
  sheet.addRow([]);

  addSectionTitle(sheet, 'Facturas por estado', colSpan);
  addTableHeader(sheet, ['Estado', 'Cantidad', 'Total', 'IVA']);
  data.invoicesByStatus.forEach((item, i) => {
    addTableRow(sheet, [
      invoiceStatusLabelEs(item.status),
      item.count,
      item.total,
      item.tax,
    ], {
      moneyCols: [3, 4],
      alt: i % 2 === 1,
    });
    sheet.getRow(sheet.lastRow!.number).getCell(2).numFmt = INT_FMT;
  });
  sheet.addRow([]);

  addSectionTitle(sheet, 'Órdenes de compra por estado', colSpan);
  addTableHeader(sheet, ['Estado', 'Cantidad', 'Total', '']);
  data.purchasesByStatus.forEach((item, i) => {
    addTableRow(sheet, [poStatusLabelEs(item.status), item.count, item.total, ''], {
      moneyCols: [3],
      alt: i % 2 === 1,
    });
    sheet.getRow(sheet.lastRow!.number).getCell(2).numFmt = INT_FMT;
  });

  finishSheet(sheet, colSpan, ctx);
  return workbook.xlsx.writeBuffer();
}
