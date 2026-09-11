import { create } from 'zustand';
import type { CompanySettings } from '@/types/settings.types';

interface CompanyState {
  currency: string;
  defaultTaxRate: number;
  applySettings: (settings: CompanySettings) => void;
  reset: () => void;
}

const defaults = {
  currency: 'EUR',
  defaultTaxRate: 21,
};

export const useCompanyStore = create<CompanyState>((set) => ({
  ...defaults,
  applySettings: (settings) =>
    set({
      currency: settings.currency ?? defaults.currency,
      defaultTaxRate: settings.defaultTaxRate ?? defaults.defaultTaxRate,
    }),
  reset: () => set(defaults),
}));
