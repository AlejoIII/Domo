import { api } from './api';
import type { AttachmentEntityType } from '@/lib/attachmentEntity';

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchAttachments(entityType: AttachmentEntityType, entityId: string) {
  const res = await api.get('/attachments', { params: { entityType, entityId } });
  return unwrap<Attachment[]>(res.data);
}

export async function createAttachment(payload: {
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  size?: number;
}) {
  const res = await api.post('/attachments', payload);
  return unwrap<Attachment>(res.data);
}

export async function deleteAttachment(id: string) {
  await api.delete(`/attachments/${id}`);
}
