/** Etiquetas en español — alineadas con el frontend (documentStatus.ts) */

const ORDER_STATUS: Record<string, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  invoiced: 'Facturado',
};

const INVOICE_STATUS: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  partially_paid: 'Pago parcial',
  paid: 'Pagada',
  cancelled: 'Cancelado',
  overdue: 'Vencida',
};

const QUOTE_STATUS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Caducado',
};

const PO_STATUS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  received: 'Recibido',
  cancelled: 'Cancelado',
};

const ALL_STATUS_LABELS: Record<string, string> = {
  ...ORDER_STATUS,
  ...INVOICE_STATUS,
  ...QUOTE_STATUS,
  ...PO_STATUS,
};

export function statusLabelEs(status: string): string {
  return ALL_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function orderStatusLabelEs(status: string): string {
  return ORDER_STATUS[status] ?? statusLabelEs(status);
}

export function invoiceStatusLabelEs(status: string): string {
  return INVOICE_STATUS[status] ?? statusLabelEs(status);
}

export function poStatusLabelEs(status: string): string {
  return PO_STATUS[status] ?? statusLabelEs(status);
}
