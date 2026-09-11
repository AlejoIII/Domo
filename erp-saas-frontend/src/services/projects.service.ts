import { api } from './api';
import type { Project, ProjectSummary, TimeEntry } from '@/types/project.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchProjects(params?: {
  status?: string;
  clientId?: string;
  search?: string;
}): Promise<Project[]> {
  const res = await api.get('/projects', { params });
  return unwrap<Project[]>(res.data);
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await api.get(`/projects/${id}`);
  return unwrap<Project>(res.data);
}

export async function fetchProjectSummary(id: string): Promise<ProjectSummary> {
  const res = await api.get(`/projects/${id}/summary`);
  return unwrap<ProjectSummary>(res.data);
}

export async function createProject(payload: {
  clientId: string;
  name: string;
  code?: string;
  description?: string;
  hourlyRate?: number;
  budgetHours?: number;
  startDate?: string;
}): Promise<Project> {
  const res = await api.post('/projects', payload);
  return unwrap<Project>(res.data);
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function fetchTimeEntries(params?: {
  projectId?: string;
  employeeId?: string;
  from?: string;
  to?: string;
  unbilled?: boolean;
}): Promise<TimeEntry[]> {
  const res = await api.get('/projects/time-entries', {
    params: {
      ...params,
      ...(params?.unbilled ? { unbilled: '1' } : {}),
    },
  });
  return unwrap<TimeEntry[]>(res.data);
}

export async function createTimeEntry(
  projectId: string,
  payload: {
    employeeId: string;
    entryDate: string;
    hours: number;
    description?: string;
    billable?: boolean;
  },
): Promise<TimeEntry> {
  const res = await api.post(`/projects/${projectId}/time-entries`, payload);
  return unwrap<TimeEntry>(res.data);
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
  await api.delete(`/projects/time-entries/${entryId}`);
}

export async function generateProjectInvoice(
  projectId: string,
  payload?: { taxRate?: number; notes?: string },
) {
  const res = await api.post(`/projects/${projectId}/generate-invoice`, payload ?? {});
  return unwrap<{ invoice: { id: string; number: string; total: number }; entriesBilled: number; hoursBilled: number }>(
    res.data,
  );
}
