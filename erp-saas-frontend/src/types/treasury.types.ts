export interface BankAccount {
  id: string;
  name: string;
  iban: string | null;
  bankName: string | null;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankMovement {
  id: string;
  bankAccountId: string;
  bankAccount?: { id: string; name: string };
  movementDate: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  reference: string | null;
  status: 'pending' | 'reconciled';
  paymentId: string | null;
  payment?: {
    id: string;
    amount: number;
    invoice: { id: string; number: string };
  } | null;
  importBatchId: string | null;
  createdAt: string;
}

export interface PaginatedBankMovements {
  items: BankMovement[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ReconciliationBoard {
  pendingMovements: Array<{
    id: string;
    bankAccountId: string;
    bankAccount?: { id: string; name: string };
    movementDate: string;
    description: string;
    amount: number;
    reference: string | null;
  }>;
  unmatchedPayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
    reference: string | null;
    invoice: { id: string; number: string; client?: { name: string } };
  }>;
  suggestions: Array<{ movementId: string; paymentId: string; reason: string }>;
}

export interface QueryBankMovementsParams {
  page?: number;
  limit?: number;
  bankAccountId?: string;
  from?: string;
  to?: string;
  status?: 'pending' | 'reconciled';
  type?: 'in' | 'out';
}

export interface CreateBankAccountPayload {
  name: string;
  iban?: string;
  bankName?: string;
  currency?: string;
  openingBalance?: number;
  notes?: string;
}

export interface CreateBankMovementPayload {
  bankAccountId: string;
  movementDate: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  reference?: string;
}

export interface ImportBankMovementsPayload {
  bankAccountId: string;
  csv: string;
}
