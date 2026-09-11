import type { BadgeProps } from '@/components/ui/Badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  invoiced: 'Facturado',
};

export const ORDER_STATUS_FLOW = ['draft', 'confirmed', 'shipped', 'delivered', 'invoiced'] as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  partially_paid: 'Pago parcial',
  paid: 'Pagada',
  credited: 'Rectificada',
  cancelled: 'Cancelado',
};

export const INVOICE_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  invoice: 'Factura',
  credit_note: 'Rectificativa',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Caducado',
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  received: 'Recibido',
  cancelled: 'Cancelado',
};

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'draft') return 'muted';
  if (status === 'partially_paid') return 'default';
  if (status === 'credited') return 'muted';
  if (['cancelled', 'rejected', 'expired'].includes(status)) return 'danger';
  if (['paid', 'accepted', 'received', 'confirmed', 'invoiced', 'issued', 'delivered'].includes(status)) {
    return 'success';
  }
  return 'default';
}

export function statusLabel(map: Record<string, string>, status: string): string {
  return map[status] ?? status;
}
