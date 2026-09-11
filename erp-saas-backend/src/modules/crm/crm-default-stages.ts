export interface DefaultCrmStage {
  name: string;
  sortOrder: number;
  color: string;
  isClosed: boolean;
  outcome: 'won' | 'lost' | null;
}

export const DEFAULT_CRM_STAGES: DefaultCrmStage[] = [
  { name: 'Prospección', sortOrder: 1, color: '#6366f1', isClosed: false, outcome: null },
  { name: 'Calificación', sortOrder: 2, color: '#8b5cf6', isClosed: false, outcome: null },
  { name: 'Propuesta', sortOrder: 3, color: '#0ea5e9', isClosed: false, outcome: null },
  { name: 'Negociación', sortOrder: 4, color: '#f59e0b', isClosed: false, outcome: null },
  { name: 'Ganada', sortOrder: 5, color: '#22c55e', isClosed: true, outcome: 'won' },
  { name: 'Perdida', sortOrder: 6, color: '#ef4444', isClosed: true, outcome: 'lost' },
];
