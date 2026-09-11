import { api } from './api';
import type {
  CrmActivity,
  CrmIncident,
  CrmLead,
  CrmOpportunity,
  CrmPipeline,
  CrmStage,
} from '@/types/crm.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchCrmPipeline(): Promise<CrmPipeline> {
  const res = await api.get('/crm/pipeline');
  return unwrap<CrmPipeline>(res.data);
}

export async function fetchCrmStages(): Promise<CrmStage[]> {
  const res = await api.get('/crm/stages');
  return unwrap<CrmStage[]>(res.data);
}

export async function fetchCrmLeads(params?: { status?: string; search?: string }): Promise<CrmLead[]> {
  const res = await api.get('/crm/leads', { params });
  return unwrap<CrmLead[]>(res.data);
}

export async function createCrmLead(payload: {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source?: string;
  status?: string;
  statusId?: string;
  notes?: string;
}): Promise<CrmLead> {
  const res = await api.post('/crm/leads', payload);
  return unwrap<CrmLead>(res.data);
}

export async function updateCrmLead(
  id: string,
  payload: {
    status?: string;
    statusId?: string;
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    source?: string;
    notes?: string;
  },
): Promise<CrmLead> {
  const res = await api.patch(`/crm/leads/${id}`, payload);
  return unwrap<CrmLead>(res.data);
}

export async function convertCrmLead(
  id: string,
  payload?: { createOpportunity?: boolean; opportunityTitle?: string; amount?: number },
) {
  const res = await api.post(`/crm/leads/${id}/convert`, payload ?? {});
  return unwrap(res.data);
}

export async function deleteCrmLead(id: string): Promise<void> {
  await api.delete(`/crm/leads/${id}`);
}

export async function createCrmOpportunity(payload: {
  title: string;
  clientId?: string;
  leadId?: string;
  stageId?: string;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
}): Promise<CrmOpportunity> {
  const res = await api.post('/crm/opportunities', payload);
  return unwrap<CrmOpportunity>(res.data);
}

export async function moveCrmOpportunityStage(id: string, stageId: string): Promise<CrmOpportunity> {
  const res = await api.patch(`/crm/opportunities/${id}/stage`, { stageId });
  return unwrap<CrmOpportunity>(res.data);
}

export async function convertOpportunityToQuote(id: string, payload?: { notes?: string; taxRate?: number }) {
  const res = await api.post(`/crm/opportunities/${id}/convert-to-quote`, payload ?? {});
  return unwrap<{ quote: { id: string; number: string; total: number }; opportunityId: string }>(res.data);
}

export async function fetchCrmActivities(params?: {
  pending?: boolean;
  type?: string;
}): Promise<CrmActivity[]> {
  const res = await api.get('/crm/activities', {
    params: {
      ...(params?.pending ? { pending: '1' } : {}),
      ...(params?.type ? { type: params.type } : {}),
    },
  });
  return unwrap<CrmActivity[]>(res.data);
}

export async function createCrmActivity(payload: {
  type?: string;
  taskTypeId?: string;
  subject?: string;
  subjectCatalogId?: string;
  description?: string;
  dueAt?: string;
  situationId?: string;
  agendaClassificationId?: string;
  leadId?: string;
  opportunityId?: string;
  clientId?: string;
}): Promise<CrmActivity> {
  const res = await api.post('/crm/activities', payload);
  return unwrap<CrmActivity>(res.data);
}

export async function completeCrmActivity(id: string): Promise<CrmActivity> {
  const res = await api.post(`/crm/activities/${id}/complete`);
  return unwrap<CrmActivity>(res.data);
}

export async function deleteCrmActivity(id: string): Promise<void> {
  await api.delete(`/crm/activities/${id}`);
}

export async function createCrmStage(payload: {
  name: string;
  sortOrder?: number;
  color?: string;
  isClosed?: boolean;
  outcome?: 'won' | 'lost' | null;
}): Promise<CrmStage> {
  const res = await api.post('/crm/stages', payload);
  return unwrap<CrmStage>(res.data);
}

export async function updateCrmStage(
  id: string,
  payload: {
    name?: string;
    sortOrder?: number;
    color?: string;
    isClosed?: boolean;
    outcome?: 'won' | 'lost' | null;
  },
): Promise<CrmStage> {
  const res = await api.patch(`/crm/stages/${id}`, payload);
  return unwrap<CrmStage>(res.data);
}

export async function reorderCrmStages(stages: Array<{ id: string; sortOrder: number }>): Promise<CrmStage[]> {
  const res = await api.patch('/crm/stages/reorder', { stages });
  return unwrap<CrmStage[]>(res.data);
}

export async function deleteCrmStage(id: string, moveToStageId?: string): Promise<void> {
  await api.delete(`/crm/stages/${id}`, { params: moveToStageId ? { moveToStageId } : undefined });
}

export async function fetchCrmIncidents(params?: {
  status?: string;
  search?: string;
}): Promise<CrmIncident[]> {
  const res = await api.get('/crm/incidents', { params });
  return unwrap<CrmIncident[]>(res.data);
}

export async function createCrmIncident(payload: {
  title: string;
  description?: string;
  priority?: string;
  typeId?: string;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
}): Promise<CrmIncident> {
  const res = await api.post('/crm/incidents', payload);
  return unwrap<CrmIncident>(res.data);
}

export async function updateCrmIncident(
  id: string,
  payload: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    typeId?: string;
  },
): Promise<CrmIncident> {
  const res = await api.patch(`/crm/incidents/${id}`, payload);
  return unwrap<CrmIncident>(res.data);
}

export async function deleteCrmIncident(id: string): Promise<void> {
  await api.delete(`/crm/incidents/${id}`);
}

export async function sendCrmEmail(payload: {
  to: string;
  templateId?: string;
  subject?: string;
  bodyHtml?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
}) {
  const res = await api.post('/crm/send-email', payload);
  return unwrap<{ message: string; to: string }>(res.data);
}

export async function sendCrmSms(payload: {
  to: string;
  templateId?: string;
  body?: string;
  acreliaAccountId?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
}) {
  const res = await api.post('/crm/send-sms', payload);
  return unwrap<{ message: string; to: string }>(res.data);
}
