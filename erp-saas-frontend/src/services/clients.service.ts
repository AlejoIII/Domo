import { api } from './api';
import type {
  Client,
  ClientNote,
  ClientPayload,
  ClientSummary,
  ClientTimelineItem,
  ClientsListResponse,
} from '@/types/client.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchClients(params: {
  page?: number;
  limit?: number;
  search?: string;
  segment?: string;
  city?: string;
  sortBy?: 'createdAt' | 'name' | 'billing';
}): Promise<ClientsListResponse> {
  const res = await api.get('/clients', { params });
  return unwrap<ClientsListResponse>(res.data);
}

export async function fetchClient(id: string): Promise<Client> {
  const res = await api.get(`/clients/${id}`);
  return unwrap<Client>(res.data);
}

export async function fetchClientSummary(id: string): Promise<ClientSummary> {
  const res = await api.get(`/clients/${id}/summary`);
  return unwrap<ClientSummary>(res.data);
}

export async function fetchClientTimeline(id: string): Promise<{ items: ClientTimelineItem[] }> {
  const res = await api.get(`/clients/${id}/timeline`);
  return unwrap<{ items: ClientTimelineItem[] }>(res.data);
}

export async function fetchClientNotes(id: string): Promise<ClientNote[]> {
  const res = await api.get(`/clients/${id}/notes`);
  return unwrap<ClientNote[]>(res.data);
}

export async function createClientNote(id: string, text: string): Promise<ClientNote> {
  const res = await api.post(`/clients/${id}/notes`, { text });
  return unwrap<ClientNote>(res.data);
}

export async function deleteClientNote(clientId: string, noteId: string): Promise<void> {
  await api.delete(`/clients/${clientId}/notes/${noteId}`);
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const res = await api.post('/clients', payload);
  return unwrap<Client>(res.data);
}

export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  const res = await api.patch(`/clients/${id}`, payload);
  return unwrap<Client>(res.data);
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
