export type CrmLeadStatus = string;
export type CrmOpportunityStatus = 'open' | 'won' | 'lost';
export type CrmActivityType = string;

export interface CrmCatalogRef {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
}

export interface CrmUserRef {
  id: string;
  name: string;
  email: string;
}

export interface CrmStage {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
  isClosed: boolean;
  outcome: 'won' | 'lost' | null;
  _count?: { opportunities: number };
}

export type CrmIncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type CrmIncidentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CrmIncident {
  id: string;
  title: string;
  description: string | null;
  status: CrmIncidentStatus;
  priority: CrmIncidentPriority;
  typeId: string | null;
  typeCatalog: CrmCatalogRef | null;
  clientId: string | null;
  client?: { id: string; name: string } | null;
  leadId: string | null;
  lead?: { id: string; name: string } | null;
  opportunityId: string | null;
  opportunity?: { id: string; title: string } | null;
  assignedTo: CrmUserRef | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: string | null;
  status: CrmLeadStatus;
  statusId: string | null;
  statusCatalog: CrmCatalogRef | null;
  notes: string | null;
  clientId: string | null;
  client?: { id: string; name: string } | null;
  assignedTo: CrmUserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOpportunity {
  id: string;
  title: string;
  stageId: string;
  stage?: CrmStage;
  clientId: string | null;
  client?: { id: string; name: string } | null;
  leadId: string | null;
  lead?: { id: string; name: string } | null;
  amount: number | null;
  probability: number;
  expectedCloseDate: string | null;
  status: CrmOpportunityStatus;
  lostReason: string | null;
  quoteId: string | null;
  quote?: { id: string; number: string; status: string } | null;
  notes: string | null;
  assignedTo: CrmUserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmPipeline {
  stages: Array<CrmStage & { opportunities: CrmOpportunity[] }>;
  summary: { totalOpen: number; totalValue: number };
}

export interface CrmActivity {
  id: string;
  type: CrmActivityType;
  taskTypeId: string | null;
  taskTypeCatalog: CrmCatalogRef | null;
  subject: string;
  subjectCatalogId: string | null;
  subjectCatalog: CrmCatalogRef | null;
  situationId: string | null;
  situationCatalog: CrmCatalogRef | null;
  agendaClassificationId: string | null;
  agendaClassification: CrmCatalogRef | null;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  leadId: string | null;
  lead?: { id: string; name: string } | null;
  opportunityId: string | null;
  opportunity?: { id: string; title: string } | null;
  clientId: string | null;
  client?: { id: string; name: string } | null;
  assignedTo: CrmUserRef | null;
  createdBy: CrmUserRef | null;
  createdAt: string;
  updatedAt: string;
}
