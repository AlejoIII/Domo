export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
  isActive: boolean;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
}

export interface LedgerMovement {
  entryNumber: number;
  entryDate: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerReport {
  account: { id: string; code: string; name: string; type: string };
  movements: LedgerMovement[];
  closingBalance: number;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

export interface AccountingPeriodParams {
  from?: string;
  to?: string;
}
