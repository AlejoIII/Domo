export type FieldType = 'text' | 'email' | 'integer' | 'decimal' | 'textarea' | 'date' | 'phone';

export interface FieldOverride {
  type: FieldType;
  label?: string;
  required?: boolean;
  colSpan?: number;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

export interface FormLayoutConfig {
  rows: number;
  cols: number;
  placements: Record<string, string | null>;
  overrides: Record<string, FieldOverride>;
  customFields?: CustomFieldDefinition[];
}

export interface EntityFieldDefinition {
  id: string;
  label: string;
  defaultType: FieldType;
  required?: boolean;
  isCustom?: boolean;
  /** Ejemplo del dato esperado; sin valor se usa el genérico del tipo */
  placeholder?: string;
}

export interface FormLayoutResponse {
  entityId: string;
  config: FormLayoutConfig;
  isDefault: boolean;
}
