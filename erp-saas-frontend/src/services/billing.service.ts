import { api } from './api';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  maxUsers: number;
  maxDocuments: number | null;
  features: Record<string, boolean>;
  sortOrder: number;
  purchasable?: boolean;
}

export interface BillingUsage {
  plan: {
    code: string;
    name: string;
    maxUsers: number;
    maxDocuments: number | null;
    features: Record<string, boolean>;
    trial?: boolean;
  };
  subscriptionStatus: string;
  trialEndsAt: string | null;
  onboardingCompleted: boolean;
  usage: {
    users: number;
    documentsThisMonth: number;
  };
}

export interface BillingStatus {
  stripeEnabled: boolean;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  demoPlanSwitchEnabled?: boolean;
}

export interface BillingPrintBranding {
  planCode: string;
  planName: string;
  trial: boolean;
  pdfWatermark: boolean;
  watermarkText: string | null;
  upgradePlan: string | null;
}

export async function fetchBillingPrintBranding(): Promise<BillingPrintBranding> {
  const res = await api.get('/billing/print-branding');
  return unwrap<BillingPrintBranding>(res.data);
}

export async function fetchBillingUsage(): Promise<BillingUsage> {
  const res = await api.get('/billing/usage');
  return unwrap<BillingUsage>(res.data);
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const res = await api.get('/billing/status');
  return unwrap<BillingStatus>(res.data);
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const res = await api.get('/billing/plans');
  return unwrap<BillingPlan[]>(res.data);
}

export async function createBillingCheckout(planCode: string): Promise<{ url: string }> {
  const res = await api.post('/billing/checkout', { planCode });
  return unwrap<{ url: string }>(res.data);
}

export async function createBillingPortal(): Promise<{ url: string }> {
  const res = await api.post('/billing/portal');
  return unwrap<{ url: string }>(res.data);
}

export async function syncBillingSubscription(): Promise<{
  synced: boolean;
  reason?: 'no_customer' | 'no_subscription';
  subscriptionStatus?: string;
}> {
  const res = await api.post('/billing/sync');
  return unwrap(res.data);
}

export async function switchDemoPlan(planCode: string): Promise<{
  message: string;
  planCode: string;
  planName: string;
}> {
  const res = await api.patch('/billing/demo-plan', { planCode });
  return unwrap(res.data);
}

export async function completeOnboarding(completed = true): Promise<{ onboardingCompleted: boolean }> {
  const res = await api.patch('/settings/onboarding', { completed });
  return unwrap(res.data);
}
