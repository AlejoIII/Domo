export type ClientSegment = 'lead' | 'active' | 'inactive';

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  segment?: ClientSegment;
  isActive: boolean;
  anonymizedAt?: string | null;
  totalBilled?: number;
  outstanding?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsListResponse {
  items: Client[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientPayload {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  segment?: ClientSegment;
  isActive?: boolean;
}

export interface ClientSummary {
  totalBilled: number;
  outstanding: number;
  ordersCount: number;
  quotesCount: number;
  lastOrder: {
    id: string;
    number: string;
    orderDate: string;
    total: number;
    status: string;
  } | null;
}

export interface ClientTimelineItem {
  type: 'order' | 'invoice' | 'payment' | 'note';
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  amount?: number;
}

export interface ClientNote {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}
