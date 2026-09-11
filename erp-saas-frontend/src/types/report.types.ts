export interface ReportPeriodParams {
  from?: string;
  to?: string;
}

export interface SalesReport {
  summary: {
    ordersCount: number;
    ordersTotal: number;
    quotesCount: number;
    quotesTotal: number;
    acceptedQuotes: number;
    conversionRate: number;
  };
  byStatus: { status: string; count: number; total: number }[];
  topClients: {
    clientId: string;
    clientName: string;
    orders: number;
    total: number;
  }[];
  recentOrders: {
    id: string;
    number: string;
    status: string;
    total: number;
    orderDate: string;
    client?: { id: string; name: string } | null;
  }[];
}

export interface FinanceReport {
  summary: {
    billed: number;
    collected: number;
    outstanding: number;
    draftTotal: number;
    taxCollected: number;
    purchasesTotal: number;
    purchasesReceived: number;
    margin: number;
  };
  invoicesByStatus: {
    status: string;
    count: number;
    total: number;
    tax: number;
    subtotal: number;
  }[];
  purchasesByStatus: { status: string; count: number; total: number }[];
  recentInvoices: {
    id: string;
    number: string;
    status: string;
    total: number;
    taxAmount: number;
    paidAmount?: number;
    balanceDue?: number;
    isOverdue?: boolean;
    issueDate: string;
    dueDate?: string | null;
    client?: { id: string; name: string } | null;
  }[];
}

export type ExportJobState = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJobStatus {
  jobId: string;
  status: ExportJobState;
  reportType?: 'sales' | 'finance';
  format?: 'csv' | 'xlsx';
  fileName?: string;
  error?: string;
  message?: string;
  pollUrl?: string;
  downloadUrl?: string;
  createdAt?: string;
  completedAt?: string;
}
