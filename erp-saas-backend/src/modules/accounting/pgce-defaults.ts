export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
}

/** Plan contable PGCE simplificado para PYME (ventas + cobros). */
export const PGCE_DEFAULT_ACCOUNTS: DefaultAccount[] = [
  { code: '430', name: 'Clientes', type: 'asset' },
  { code: '472', name: 'Hacienda Pública, IVA soportado', type: 'asset' },
  { code: '477', name: 'Hacienda Pública, IVA repercutido', type: 'liability' },
  { code: '570', name: 'Caja', type: 'asset' },
  { code: '572', name: 'Bancos e instituciones de crédito', type: 'asset' },
  { code: '700', name: 'Ventas de mercaderías', type: 'income' },
  { code: '410', name: 'Proveedores', type: 'liability' },
  { code: '600', name: 'Compras de mercaderías', type: 'expense' },
  { code: '100', name: 'Capital social', type: 'equity' },
  { code: '129', name: 'Resultado del ejercicio', type: 'equity' },
];

export const ACCOUNT_CODES = {
  clients: '430',
  vatOutput: '477',
  vatInput: '472',
  bank: '572',
  sales: '700',
  suppliers: '410',
} as const;
