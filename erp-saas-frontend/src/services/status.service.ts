import { api } from './api';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export interface PublicStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  components: {
    api: 'ok';
    database: string;
    redis: string;
  };
}

export async function fetchPublicStatus(): Promise<PublicStatus> {
  const res = await api.get('/status/public');
  return unwrap<PublicStatus>(res.data);
}
