import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationsState {
  dismissedIds: string[];
  lastSeenAt: string | null;
  dismiss: (id: string) => void;
  dismissAll: (ids: string[]) => void;
  markSeen: () => void;
  clearDismissed: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      dismissedIds: [],
      lastSeenAt: null,
      dismiss: (id) =>
        set((s) => ({
          dismissedIds: s.dismissedIds.includes(id) ? s.dismissedIds : [...s.dismissedIds, id],
        })),
      dismissAll: (ids) =>
        set((s) => ({
          dismissedIds: [...new Set([...s.dismissedIds, ...ids])],
          lastSeenAt: new Date().toISOString(),
        })),
      markSeen: () => set({ lastSeenAt: new Date().toISOString() }),
      clearDismissed: () => set({ dismissedIds: [] }),
    }),
    { name: 'domo-notifications' },
  ),
);
