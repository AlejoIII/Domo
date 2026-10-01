export type DataImportKind = 'warehouses' | 'clients' | 'products';

export interface DataImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  dryRun: boolean;
}

export interface ImportCsvPayload {
  csv: string;
  dryRun?: boolean;
}

export interface ImportProductsPayload extends ImportCsvPayload {
  defaultWarehouseCode?: string;
}

export interface DataImportTemplate {
  filename: string;
  content: string;
}
