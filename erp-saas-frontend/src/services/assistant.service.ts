import { api } from './api';

export type AssistantChatRole = 'user' | 'assistant';

export interface AssistantChatMessage {
  role: AssistantChatRole;
  content: string;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export type AssistantMode = 'live' | 'mock' | 'off';

export async function fetchAssistantStatus(): Promise<{
  enabled: boolean;
  purpose: string;
  mode?: AssistantMode;
}> {
  const res = await api.get('/assistant/status');
  return unwrap(res.data);
}

export async function sendAssistantMessage(
  message: string,
  history: AssistantChatMessage[],
): Promise<{ reply: string }> {
  const res = await api.post('/assistant/chat', { message, history });
  return unwrap(res.data);
}
