export interface WebhookJobPayload {
  companyId: string;
  event: string;
  data: Record<string, unknown>;
}

export interface AuditJobPayload {
  action: string;
  companyId: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface RawEmailJobPayload {
  kind: 'raw';
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface CustomEmailJobPayload {
  kind: 'custom';
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
  bcc?: string;
}

export interface DocumentEmailJobPayload {
  kind: 'document';
  to: string;
  documentType: 'quote' | 'invoice';
  documentNumber: string;
  companyName: string;
  printUrl: string;
}

export interface InvitationEmailJobPayload {
  kind: 'invitation';
  to: string;
  inviteUrl: string;
  companyName: string;
}

export type EmailJobPayload =
  | RawEmailJobPayload
  | CustomEmailJobPayload
  | DocumentEmailJobPayload
  | InvitationEmailJobPayload;

export interface ExportJobPayload {
  jobId: string;
  companyId: string;
  reportType: 'sales' | 'finance';
  format: 'csv' | 'xlsx';
  query: { from?: string; to?: string };
}

export interface VerifactuJobPayload {
  companyId: string;
  recordId: string;
}
