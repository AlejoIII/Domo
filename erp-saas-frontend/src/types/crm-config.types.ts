export type CrmCatalogCategory =
  | 'subject'
  | 'agenda_classification'
  | 'status'
  | 'task_situation'
  | 'incident_type'
  | 'suggestion_type'
  | 'task_type';

export interface CrmCatalogItem {
  id: string;
  companyId: string;
  category: CrmCatalogCategory;
  name: string;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmEmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface CrmSmsTemplate {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CrmEmailSettings {
  id: string;
  companyId: string;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  signatureHtml?: string | null;
  copyTo?: string | null;
  defaultEmailTemplateId?: string | null;
}

export interface CrmAcreliaAccount {
  id: string;
  name: string;
  senderId?: string | null;
  isActive: boolean;
  notes?: string | null;
  apiKey?: string | null;
  hasApiKey?: boolean;
}

export interface CrmCatalogItemPayload {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CrmEmailTemplatePayload {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CrmSmsTemplatePayload {
  name: string;
  body: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CrmEmailSettingsPayload {
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  signatureHtml?: string;
  copyTo?: string;
  defaultEmailTemplateId?: string;
}

export interface CrmAcreliaAccountPayload {
  name: string;
  apiKey?: string;
  senderId?: string;
  isActive?: boolean;
  notes?: string;
}
