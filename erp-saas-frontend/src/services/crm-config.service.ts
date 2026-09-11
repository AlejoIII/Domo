import { api } from './api';
import type {
  CrmAcreliaAccount,
  CrmAcreliaAccountPayload,
  CrmCatalogCategory,
  CrmCatalogItem,
  CrmCatalogItemPayload,
  CrmEmailSettings,
  CrmEmailSettingsPayload,
  CrmEmailTemplate,
  CrmEmailTemplatePayload,
  CrmSmsTemplate,
  CrmSmsTemplatePayload,
} from '@/types/crm-config.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchCrmCatalog(category: CrmCatalogCategory, search?: string) {
  const res = await api.get(`/crm/config/catalogs/${category}`, {
    params: search ? { search } : undefined,
  });
  return unwrap<CrmCatalogItem[]>(res.data);
}

export async function createCrmCatalogItem(category: CrmCatalogCategory, payload: CrmCatalogItemPayload) {
  const res = await api.post(`/crm/config/catalogs/${category}`, payload);
  return unwrap<CrmCatalogItem>(res.data);
}

export async function updateCrmCatalogItem(
  category: CrmCatalogCategory,
  id: string,
  payload: CrmCatalogItemPayload,
) {
  const res = await api.patch(`/crm/config/catalogs/${category}/${id}`, payload);
  return unwrap<CrmCatalogItem>(res.data);
}

export async function deleteCrmCatalogItem(category: CrmCatalogCategory, id: string) {
  await api.delete(`/crm/config/catalogs/${category}/${id}`);
}

export async function fetchCrmEmailTemplates() {
  const res = await api.get('/crm/config/email-templates');
  return unwrap<CrmEmailTemplate[]>(res.data);
}

export async function createCrmEmailTemplate(payload: CrmEmailTemplatePayload) {
  const res = await api.post('/crm/config/email-templates', payload);
  return unwrap<CrmEmailTemplate>(res.data);
}

export async function updateCrmEmailTemplate(id: string, payload: CrmEmailTemplatePayload) {
  const res = await api.patch(`/crm/config/email-templates/${id}`, payload);
  return unwrap<CrmEmailTemplate>(res.data);
}

export async function deleteCrmEmailTemplate(id: string) {
  await api.delete(`/crm/config/email-templates/${id}`);
}

export async function fetchCrmSmsTemplates() {
  const res = await api.get('/crm/config/sms-templates');
  return unwrap<CrmSmsTemplate[]>(res.data);
}

export async function createCrmSmsTemplate(payload: CrmSmsTemplatePayload) {
  const res = await api.post('/crm/config/sms-templates', payload);
  return unwrap<CrmSmsTemplate>(res.data);
}

export async function updateCrmSmsTemplate(id: string, payload: CrmSmsTemplatePayload) {
  const res = await api.patch(`/crm/config/sms-templates/${id}`, payload);
  return unwrap<CrmSmsTemplate>(res.data);
}

export async function deleteCrmSmsTemplate(id: string) {
  await api.delete(`/crm/config/sms-templates/${id}`);
}

export async function fetchCrmEmailSettings() {
  const res = await api.get('/crm/config/email-settings');
  return unwrap<CrmEmailSettings>(res.data);
}

export async function updateCrmEmailSettings(payload: CrmEmailSettingsPayload) {
  const res = await api.patch('/crm/config/email-settings', payload);
  return unwrap<CrmEmailSettings>(res.data);
}

export async function fetchCrmAcreliaAccounts() {
  const res = await api.get('/crm/config/acrelia-accounts');
  return unwrap<CrmAcreliaAccount[]>(res.data);
}

export async function createCrmAcreliaAccount(payload: CrmAcreliaAccountPayload) {
  const res = await api.post('/crm/config/acrelia-accounts', payload);
  return unwrap<CrmAcreliaAccount>(res.data);
}

export async function updateCrmAcreliaAccount(id: string, payload: CrmAcreliaAccountPayload) {
  const res = await api.patch(`/crm/config/acrelia-accounts/${id}`, payload);
  return unwrap<CrmAcreliaAccount>(res.data);
}

export async function deleteCrmAcreliaAccount(id: string) {
  await api.delete(`/crm/config/acrelia-accounts/${id}`);
}
