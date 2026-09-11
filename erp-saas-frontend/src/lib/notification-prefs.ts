import { usePreferencesStore } from '@/store/preferences.store';

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

export function applyNotificationPrefs(prefs: NotificationPrefs) {
  const store = usePreferencesStore.getState();
  store.setNotifyOrders(prefs.notifyOrders);
  store.setNotifyInvoices(prefs.notifyInvoices);
  store.setNotifySystem(prefs.notifySystem);
}
