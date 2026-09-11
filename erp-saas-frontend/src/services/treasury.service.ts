import { api } from './api';
import type {
  BankAccount,
  CreateBankAccountPayload,
  CreateBankMovementPayload,
  ImportBankMovementsPayload,
  PaginatedBankMovements,
  QueryBankMovementsParams,
  ReconciliationBoard,
} from '@/types/treasury.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const res = await api.get('/treasury/accounts');
  return unwrap<BankAccount[]>(res.data);
}

export async function createBankAccount(payload: CreateBankAccountPayload): Promise<BankAccount> {
  const res = await api.post('/treasury/accounts', payload);
  return unwrap<BankAccount>(res.data);
}

export async function updateBankAccount(
  id: string,
  payload: Partial<CreateBankAccountPayload> & { isActive?: boolean },
): Promise<BankAccount> {
  const res = await api.patch(`/treasury/accounts/${id}`, payload);
  return unwrap<BankAccount>(res.data);
}

export async function deleteBankAccount(id: string): Promise<void> {
  await api.delete(`/treasury/accounts/${id}`);
}

export async function fetchBankMovements(
  params?: QueryBankMovementsParams,
): Promise<PaginatedBankMovements> {
  const res = await api.get('/treasury/movements', { params });
  return unwrap<PaginatedBankMovements>(res.data);
}

export async function createBankMovement(payload: CreateBankMovementPayload) {
  const res = await api.post('/treasury/movements', payload);
  return unwrap(res.data);
}

export async function importBankMovements(payload: ImportBankMovementsPayload) {
  const res = await api.post('/treasury/movements/import', payload);
  return unwrap<{ importBatchId: string; imported: number; message: string }>(res.data);
}

export async function fetchReconciliationBoard(bankAccountId?: string): Promise<ReconciliationBoard> {
  const res = await api.get('/treasury/reconciliation', {
    params: bankAccountId ? { bankAccountId } : undefined,
  });
  return unwrap<ReconciliationBoard>(res.data);
}

export async function reconcileMovement(movementId: string, paymentId: string) {
  const res = await api.post(`/treasury/movements/${movementId}/reconcile`, { paymentId });
  return unwrap(res.data);
}

export async function unreconcileMovement(movementId: string) {
  const res = await api.delete(`/treasury/movements/${movementId}/reconcile`);
  return unwrap(res.data);
}
