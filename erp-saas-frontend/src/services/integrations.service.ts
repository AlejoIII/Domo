import { api } from './api';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKeyRow {
  plainKey: string;
}

export interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  secret?: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  responseStatus: number | null;
  attempts: number;
  createdAt: string;
  endpoint: { id: string; url: string };
}

export interface IntegrationsMeta {
  scopes: string[];
  events: string[];
  publicApiBase: string;
  docsUrl: string;
}

export async function fetchIntegrationsMeta(): Promise<IntegrationsMeta> {
  const res = await api.get('/integrations/meta');
  return unwrap(res.data);
}

export async function fetchApiKeys(): Promise<ApiKeyRow[]> {
  const res = await api.get('/integrations/api-keys');
  return unwrap(res.data);
}

export async function createApiKey(payload: {
  name: string;
  scopes?: string[];
}): Promise<ApiKeyCreated> {
  const res = await api.post('/integrations/api-keys', payload);
  return unwrap(res.data);
}

export async function revokeApiKey(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/integrations/api-keys/${id}`);
  return unwrap(res.data);
}

export async function fetchWebhooks(): Promise<WebhookRow[]> {
  const res = await api.get('/integrations/webhooks');
  return unwrap(res.data);
}

export async function fetchWebhookDeliveries(): Promise<WebhookDelivery[]> {
  const res = await api.get('/integrations/webhooks/deliveries');
  return unwrap(res.data);
}

export async function createWebhook(payload: {
  url: string;
  events: string[];
}): Promise<WebhookRow> {
  const res = await api.post('/integrations/webhooks', payload);
  return unwrap(res.data);
}

export async function deleteWebhook(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/integrations/webhooks/${id}`);
  return unwrap(res.data);
}

export async function testWebhook(id: string): Promise<{ ok: boolean; status?: string }> {
  const res = await api.post(`/integrations/webhooks/${id}/test`);
  return unwrap(res.data);
}
