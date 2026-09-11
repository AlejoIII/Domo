import { api } from './api';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
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

export async function submitFeedback(payload: {
  message: string;
  rating?: number;
  page?: string;
}) {
  const res = await api.post('/feedback', payload);
  return unwrap<{ id: string; message: string; createdAt: string }>(res.data);
}
