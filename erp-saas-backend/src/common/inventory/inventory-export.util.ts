const TYPE_LABELS: Record<string, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
  transfer: 'Transferencia',
};

const REF_LABELS: Record<string, string> = {
  sales_order: 'Pedido venta',
  purchase_order: 'Orden compra',
  manual: 'Manual',
  transfer: 'Transferencia',
};

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

export function buildMovementsCsv(
  items: Array<{
    createdAt: Date;
    type: string;
    quantity: number;
    referenceType?: string | null;
    referenceId?: string | null;
    transferGroupId?: string | null;
    notes?: string | null;
    product?: { code: string; name: string } | null;
    warehouse?: { code: string; name: string } | null;
  }>,
) {
  let csv = '\uFEFF';
  csv += row([
    'Fecha',
    'Tipo',
    'Producto código',
    'Producto',
    'Almacén código',
    'Almacén',
    'Cantidad',
    'Referencia',
    'ID referencia',
    'Grupo transferencia',
    'Notas',
  ]);

  for (const m of items) {
    csv += row([
      m.createdAt.toISOString(),
      TYPE_LABELS[m.type] ?? m.type,
      m.product?.code ?? '',
      m.product?.name ?? '',
      m.warehouse?.code ?? '',
      m.warehouse?.name ?? '',
      m.quantity,
      m.referenceType ? (REF_LABELS[m.referenceType] ?? m.referenceType) : '',
      m.referenceId ?? '',
      m.transferGroupId ?? '',
      m.notes ?? '',
    ]);
  }

  return csv;
}

export function buildStockValuationCsv(
  data: {
    summary: { totalValue: number; totalUnits: number; lineCount: number };
    byWarehouse: Array<{
      warehouse: { code: string; name: string };
      quantity: number;
      value: number;
    }>;
    lines: Array<{
      warehouse: { code: string; name: string };
      product: { code: string; name: string };
      quantity: number;
      unitCost: number;
      valuation: number;
    }>;
  },
  companyName: string,
) {
  let csv = '\uFEFF';
  csv += row(['Informe valoración stock', companyName]);
  csv += row(['Unidades totales', data.summary.totalUnits]);
  csv += row(['Valor total', data.summary.totalValue.toFixed(2)]);
  csv += row([]);
  csv += row(['Almacén código', 'Almacén', 'Unidades', 'Valor']);
  for (const wh of data.byWarehouse) {
    csv += row([wh.warehouse.code, wh.warehouse.name, wh.quantity, wh.value.toFixed(2)]);
  }
  csv += row([]);
  csv += row(['Almacén', 'Producto código', 'Producto', 'Cantidad', 'Coste unit.', 'Valoración']);
  for (const line of data.lines) {
    csv += row([
      line.warehouse.name,
      line.product.code,
      line.product.name,
      line.quantity,
      line.unitCost.toFixed(2),
      line.valuation.toFixed(2),
    ]);
  }
  return csv;
}

export { TYPE_LABELS, REF_LABELS };
