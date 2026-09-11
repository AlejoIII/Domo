import { api } from './api';
import type { AuthUser } from './auth.service';
import type {
  ChangePasswordPayload,
  CompanySettings,
  NotificationPrefs,
  UpdateCompanyPayload,
  UpdateNotificationPrefsPayload,
  UpdateProfilePayload,
} from '@/types/settings.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const res = await api.get('/settings/company');
  return unwrap<CompanySettings>(res.data);
}

export async function updateCompanySettings(
  payload: UpdateCompanyPayload,
): Promise<CompanySettings> {
  const res = await api.patch('/settings/company', payload);
  return unwrap<CompanySettings>(res.data);
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const res = await api.patch('/settings/profile', payload);
  return unwrap<AuthUser>(res.data);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const res = await api.post('/settings/change-password', payload);
  return unwrap(res.data);
}

export async function fetchCompanyUsers() {
  const res = await api.get('/settings/users');
  return unwrap(res.data) as import('@/types/role.types').CompanyUser[];
}

export async function assignUserRole(userId: string, roleId: string | null) {
  const res = await api.patch(`/settings/users/${userId}/role`, { roleId });
  return unwrap(res.data) as import('@/types/role.types').CompanyUser;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  inviteUrl?: string;
  fullInviteUrl?: string;
  emailSent?: boolean;
  emailError?: string;
  emailProvider?: string;
  role?: { id: string; name: string } | null;
}

export interface EmailStatus {
  configured: boolean;
  provider: string;
  verificationEnabled: boolean;
}

export async function fetchEmailStatus(): Promise<EmailStatus> {
  const res = await api.get('/settings/email-status');
  return unwrap<EmailStatus>(res.data);
}

export async function fetchInvitations() {
  const res = await api.get('/settings/invitations');
  return unwrap<Invitation[]>(res.data);
}

export async function createInvitation(payload: { email: string; roleId?: string }) {
  const res = await api.post('/settings/invitations', payload);
  return unwrap<Invitation>(res.data);
}

export async function cancelInvitation(id: string) {
  const res = await api.delete(`/settings/invitations/${id}`);
  return unwrap(res.data);
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const res = await api.get('/settings/notifications');
  return unwrap<NotificationPrefs>(res.data);
}

export async function updateNotificationPrefs(
  payload: UpdateNotificationPrefsPayload,
): Promise<NotificationPrefs> {
  const res = await api.patch('/settings/notifications', payload);
  return unwrap<NotificationPrefs>(res.data);
}

export async function fetchNavigationSettings() {
  const res = await api.get('/settings/navigation');
  return unwrap(res.data) as import('@/types/navigation.types').NavigationSettingsResponse;
}

export async function updateNavigationSettings(
  payload: import('@/types/navigation.types').NavigationPrefs,
) {
  const res = await api.patch('/settings/navigation', payload);
  return unwrap(res.data) as import('@/types/navigation.types').NavigationSettingsResponse;
}
