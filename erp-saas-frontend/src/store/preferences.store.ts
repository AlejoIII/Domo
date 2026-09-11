import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PageSize = 10 | 25 | 50;
export type Density = 'comfortable' | 'compact';
export type DateFormat = 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy';

interface PreferencesState {
  pageSize: PageSize;
  density: Density;
  dateFormat: DateFormat;
  language: 'es' | 'en';
  notifyOrders: boolean;
  notifyInvoices: boolean;
  notifySystem: boolean;
  setPageSize: (v: PageSize) => void;
  setDensity: (v: Density) => void;
  setDateFormat: (v: DateFormat) => void;
  setLanguage: (v: 'es' | 'en') => void;
  setNotifyOrders: (v: boolean) => void;
  setNotifyInvoices: (v: boolean) => void;
  setNotifySystem: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      pageSize: 10,
      density: 'comfortable',
      dateFormat: 'dd/MM/yyyy',
      language: 'es',
      notifyOrders: true,
      notifyInvoices: true,
      notifySystem: true,
      setPageSize: (pageSize) => set({ pageSize }),
      setDensity: (density) => set({ density }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setLanguage: (language) => set({ language }),
      setNotifyOrders: (notifyOrders) => set({ notifyOrders }),
      setNotifyInvoices: (notifyInvoices) => set({ notifyInvoices }),
      setNotifySystem: (notifySystem) => set({ notifySystem }),
    }),
    { name: 'domo-preferences' },
  ),
);
