import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyId: string;
  companyName?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  subscriptionStatus?: string;
  planCode?: string;
  planName?: string;
  roleId?: string | null;
  roleName?: string | null;
  permissions?: string[];
  isPlatformAdmin?: boolean;
  totpEnabled?: boolean;
  notificationPrefs?: import('@/lib/notification-prefs').NotificationPrefs;
}

export interface RegisterPayload {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteToken?: string;
  acceptedTerms: boolean;
}

export interface RegistrationConfig {
  mode: 'open' | 'invite_only';
  requiresInvite: boolean;
  betaSignupCap: number | null;
  betaSignupCount: number;
  signupCapReached: boolean;
}

export interface BetaInviteValidation {
  valid: boolean;
  label: string;
  emailLocked: boolean;
  email: string | null;
}

export interface LoginResponse {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  requiresTotp?: boolean;
  tempToken?: string;
  email?: string;
  emailSent?: boolean;
  emailError?: string;
  emailProvider?: string;
  requiresVerification?: boolean;
  devCode?: string;
  message?: string;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const res = await api.post('/auth/register', payload);
  return unwrap<LoginResponse>(res.data);
}

export async function fetchRegistrationConfig(): Promise<RegistrationConfig> {
  const res = await api.get('/auth/registration-config');
  return unwrap<RegistrationConfig>(res.data);
}

export async function validateBetaInvite(token: string, email?: string): Promise<BetaInviteValidation> {
  const res = await api.get('/auth/validate-invite', { params: { token, email } });
  return unwrap<BetaInviteValidation>(res.data);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post('/auth/login', { email, password });
  return unwrap<LoginResponse>(res.data);
}

export async function acceptInvite(payload: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await api.post('/auth/accept-invite', payload);
  return unwrap<LoginResponse>(res.data);
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get('/auth/me');
  return unwrap<AuthUser>(res.data);
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<{ message: string; user: AuthUser; accessToken?: string; refreshToken?: string }> {
  const res = await api.post('/auth/verify-email', { email, code });
  return unwrap(res.data);
}

export async function resendVerification(email: string): Promise<{
  message: string;
  devCode?: string;
  emailSent?: boolean;
  emailError?: string;
}> {
  const res = await api.post('/auth/resend-verification', { email });
  return unwrap(res.data);
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout');
}

export interface TwoFactorStatus {
  enabled: boolean;
  canSetup: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const res = await api.get('/auth/2fa/status');
  return unwrap<TwoFactorStatus>(res.data);
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const res = await api.post('/auth/2fa/setup');
  return unwrap<TwoFactorSetup>(res.data);
}

export async function enableTwoFactor(code: string): Promise<{ enabled: boolean; message: string }> {
  const res = await api.post('/auth/2fa/enable', { code });
  return unwrap(res.data);
}

export async function disableTwoFactor(code: string): Promise<{ enabled: boolean; message: string }> {
  const res = await api.post('/auth/2fa/disable', { code });
  return unwrap(res.data);
}

export async function verifyTotpLogin(
  tempToken: string,
  code: string,
): Promise<LoginResponse> {
  const res = await api.post('/auth/2fa/verify-login', { tempToken, code });
  return unwrap<LoginResponse>(res.data);
}

export async function forgotPassword(email: string): Promise<{
  message: string;
  emailSent?: boolean;
  emailError?: string;
  devResetUrl?: string;
}> {
  const res = await api.post('/auth/forgot-password', { email });
  return unwrap(res.data);
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await api.post('/auth/reset-password', { token, password });
  return unwrap(res.data);
}
