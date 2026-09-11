export interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  defaultTaxRate: number;
  currency: string;
  orderPrefix: string;
  invoicePrefix: string;
  creditNotePrefix: string;
  quotePrefix: string;
  poPrefix: string;
  monthlySalesTarget?: number | null;
  onboardingCompleted?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  planCode?: string;
  planName?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  defaultTaxRate?: number;
  currency?: string;
  orderPrefix?: string;
  invoicePrefix?: string;
  creditNotePrefix?: string;
  quotePrefix?: string;
  poPrefix?: string;
  monthlySalesTarget?: number | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationPrefs {
  notifyOrders: boolean;
  notifyInvoices: boolean;
  notifySystem: boolean;
}

export type UpdateNotificationPrefsPayload = Partial<NotificationPrefs>;
