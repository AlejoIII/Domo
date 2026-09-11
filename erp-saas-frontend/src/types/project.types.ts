export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  clientId: string;
  client?: { id: string; name: string };
  name: string;
  code: string | null;
  description: string | null;
  status: ProjectStatus;
  hourlyRate: number;
  budgetHours: number | null;
  startDate: string | null;
  endDate: string | null;
  totalHours: number;
  unbilledHours: number;
  unbilledAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  project?: { id: string; name: string; code: string | null; hourlyRate: number };
  employeeId: string;
  employee?: { id: string; name: string };
  entryDate: string;
  hours: number;
  description: string | null;
  billable: boolean;
  amount: number;
  invoiceId: string | null;
  invoice?: { id: string; number: string } | null;
  createdAt: string;
}

export interface ProjectSummary {
  project: Project;
  totals: {
    totalHours: number;
    billableHours: number;
    unbilledHours: number;
    billedAmount: number;
    unbilledAmount: number;
    budgetHours: number | null;
    budgetUsedPct: number | null;
  };
  recentEntries: Array<{
    id: string;
    entryDate: string;
    hours: number;
    billable: boolean;
    invoiced: boolean;
    description: string | null;
    employee: { id: string; name: string };
  }>;
}
