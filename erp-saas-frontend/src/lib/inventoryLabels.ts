export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
  transfer: 'Transferencia',
};

export const MOVEMENT_REF_LABELS: Record<string, string> = {
  sales_order: 'Pedido venta',
  purchase_order: 'Orden compra',
  manufacturing_order: 'Orden fabricación',
  manual: 'Manual',
  transfer: 'Transferencia',
};

export function movementTypeLabel(type: string) {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

export function movementRefLabel(ref?: string | null) {
  if (!ref) return '—';
  return MOVEMENT_REF_LABELS[ref] ?? ref;
}
