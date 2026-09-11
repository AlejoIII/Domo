import { api } from './api';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export interface PlatformCompany {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  isActive: boolean;
  subscriptionStatus: string;
  onboardingCompleted?: boolean;
  betaCohort?: string | null;
  planCode: string;
  planName: string;
  userCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PlatformCompanyDetail extends PlatformCompany {
  trialEndsAt: string | null;
  platformNotes: string | null;
  betaCohort?: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: { id: string; code: string; name: string } | null;
  users: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    isPlatformAdmin: boolean;
    lastLoginAt: string | null;
    role: { name: string } | null;
  }>;
  usage: {
    plan: { code: string; name: string; maxUsers: number; maxDocuments: number | null };
    usage: { users: number; documentsThisMonth: number };
  };
}

export interface PlatformStats {
  companies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  users: number;
}

export interface PlatformMetrics {
  signupsLast30Days: number;
  onboardingPending: number;
  onboardingComplete: number;
  trialingCount: number;
  activePaidCount: number;
  betaCohortCount: number;
  feedbackCount: number;
  activeUsersLast7Days: number;
  byPlan: Array<{ planCode: string; planName: string; count: number }>;
  byCohort: Array<{ cohort: string; count: number }>;
  registration: {
    mode: 'open' | 'invite_only';
    requiresInvite: boolean;
    betaSignupCap: number | null;
    betaSignupCount: number;
    signupCapReached: boolean;
  };
}

export interface BetaRegistrationSettings {
  mode: 'open' | 'invite_only';
  requiresInvite: boolean;
  betaSignupCap: number | null;
  betaSignupCount: number;
  signupCapReached: boolean;
  updatedAt?: string;
}

export interface BetaInvite {
  id: string;
  token: string;
  email: string | null;
  label: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  registerUrl: string;
  isActive: boolean;
  company: { id: string; name: string } | null;
}

export interface BetaFeedbackItem {
  id: string;
  rating: number | null;
  message: string;
  page: string | null;
  userId: string;
  createdAt: string;
  company: { id: string; name: string; betaCohort: string | null };
}

export interface PlatformUserSearch {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isPlatformAdmin: boolean;
  lastLoginAt: string | null;
  company: { id: string; name: string; isActive: boolean };
}

export interface PlatformBilling {
  total: number;
  withStripeSubscription: number;
  byStatus: Record<string, number>;
  items: Array<{
    id: string;
    name: string;
    planCode: string;
    planName: string;
    subscriptionStatus: string;
    hasStripe: boolean;
  }>;
}

export interface PlatformSystemStatus {
  database: string;
  redis: string;
  storage: string;
  stripe: string;
  email: string;
  maintenanceMode: boolean;
}

export interface PlatformPlan {
  id: string;
  code: string;
  name: string;
}

export async function fetchPlatformStats() {
  const res = await api.get('/platform/stats');
  return unwrap<PlatformStats>(res.data);
}

export async function fetchPlatformMetrics() {
  const res = await api.get('/platform/metrics');
  return unwrap<PlatformMetrics>(res.data);
}

export async function fetchPlatformPlans() {
  const res = await api.get('/platform/plans');
  return unwrap<PlatformPlan[]>(res.data);
}

export async function fetchPlatformCompanies(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await api.get('/platform/companies', { params });
  return unwrap<{ items: PlatformCompany[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(res.data);
}

export async function fetchPlatformCompany(id: string) {
  const res = await api.get(`/platform/companies/${id}`);
  return unwrap<PlatformCompanyDetail>(res.data);
}

export async function setPlatformCompanyStatus(id: string, isActive: boolean) {
  const res = await api.patch(`/platform/companies/${id}/status`, { isActive });
  return unwrap(res.data);
}

export async function updatePlatformCompanyPlan(id: string, planCode: string) {
  const res = await api.patch(`/platform/companies/${id}/plan`, { planCode });
  return unwrap(res.data);
}

export async function updatePlatformCompanyTrial(id: string, trialEndsAt: string) {
  const res = await api.patch(`/platform/companies/${id}/trial`, { trialEndsAt });
  return unwrap(res.data);
}

export async function updatePlatformCompanyNotes(id: string, platformNotes: string) {
  const res = await api.patch(`/platform/companies/${id}/notes`, { platformNotes });
  return unwrap(res.data);
}

export async function impersonateCompany(companyId: string, userId?: string) {
  const res = await api.post(`/platform/companies/${companyId}/impersonate`, { userId });
  return unwrap<{
    accessToken: string;
    refreshToken: string;
    impersonating: boolean;
    user: import('./auth.service').AuthUser;
  }>(res.data);
}

export async function searchPlatformUsers(search: string) {
  const res = await api.get('/platform/users', { params: { search } });
  return unwrap<PlatformUserSearch[]>(res.data);
}

export async function setPlatformUserStatus(id: string, isActive: boolean) {
  const res = await api.patch(`/platform/users/${id}/status`, { isActive });
  return unwrap(res.data);
}

export async function fetchPlatformBilling() {
  const res = await api.get('/platform/billing');
  return unwrap<PlatformBilling>(res.data);
}

export async function fetchPlatformSystemStatus() {
  const res = await api.get('/platform/system/status');
  return unwrap<PlatformSystemStatus>(res.data);
}

export async function fetchFailedWebhooks() {
  const res = await api.get('/platform/system/webhooks/failed');
  return unwrap<Array<{
    id: string;
    event: string;
    status: string;
    responseStatus: number | null;
    createdAt: string;
    endpoint: { id: string; url: string; company: { id: string; name: string } };
  }>>(res.data);
}

export async function retryPlatformWebhook(deliveryId: string) {
  const res = await api.post(`/platform/system/webhooks/${deliveryId}/retry`);
  return unwrap(res.data);
}

export async function fetchPlatformAudit(limit = 50) {
  const res = await api.get('/platform/audit', { params: { limit } });
  return unwrap<Array<{
    id: string;
    actorUserId: string;
    action: string;
    targetType: string;
    targetId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>>(res.data);
}

export async function fetchPlatformSettings() {
  const res = await api.get('/platform/settings');
  return unwrap<{ maintenanceMode: boolean; maintenanceMessage: string | null }>(res.data);
}

export async function updatePlatformMaintenance(maintenanceMode: boolean, maintenanceMessage?: string) {
  const res = await api.patch('/platform/settings/maintenance', { maintenanceMode, maintenanceMessage });
  return unwrap(res.data);
}

export async function fetchBetaRegistrationSettings() {
  const res = await api.get('/platform/beta/registration');
  return unwrap<BetaRegistrationSettings>(res.data);
}

export async function updateBetaRegistrationSettings(payload: {
  registrationMode?: 'open' | 'invite_only';
  betaSignupCap?: number | null;
}) {
  const res = await api.patch('/platform/beta/registration', payload);
  return unwrap<BetaRegistrationSettings>(res.data);
}

export async function fetchBetaInvites() {
  const res = await api.get('/platform/beta/invites');
  return unwrap<BetaInvite[]>(res.data);
}

export async function createBetaInvite(payload: {
  email?: string;
  label?: string;
  maxUses?: number;
  expiresAt?: string;
}) {
  const res = await api.post('/platform/beta/invites', payload);
  return unwrap<BetaInvite>(res.data);
}

export async function revokeBetaInvite(id: string) {
  const res = await api.delete(`/platform/beta/invites/${id}`);
  return unwrap(res.data);
}

export async function fetchBetaFeedback(limit = 50) {
  const res = await api.get('/platform/beta/feedback', { params: { limit } });
  return unwrap<BetaFeedbackItem[]>(res.data);
}
