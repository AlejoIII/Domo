export interface NotificationPrefs {
  notifyOrders: boolean;
  notifyInvoices: boolean;
  notifySystem: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notifyOrders: true,
  notifyInvoices: true,
  notifySystem: true,
};

export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  const value = raw as Record<string, unknown>;
  return {
    notifyOrders: typeof value.notifyOrders === 'boolean'
      ? value.notifyOrders
      : DEFAULT_NOTIFICATION_PREFS.notifyOrders,
    notifyInvoices: typeof value.notifyInvoices === 'boolean'
      ? value.notifyInvoices
      : DEFAULT_NOTIFICATION_PREFS.notifyInvoices,
    notifySystem: typeof value.notifySystem === 'boolean'
      ? value.notifySystem
      : DEFAULT_NOTIFICATION_PREFS.notifySystem,
  };
}
