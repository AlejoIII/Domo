export const WEBHOOK_EVENTS = [
  'invoice.paid',
  'order.confirmed',
  'stock.low',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const API_SCOPES = [
  'clients.read',
  'products.read',
  'orders.read',
  'invoices.read',
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}
