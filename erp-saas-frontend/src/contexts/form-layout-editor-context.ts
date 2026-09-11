import { createContext } from 'react';
import type { ConfigurableEntityId } from '@/config/field-definitions';
import type { FieldType, FormLayoutConfig } from '@/types/form-layout.types';

export interface FormLayoutEditorContextValue {
  entityId: ConfigurableEntityId;
  editMode: boolean;
  activeConfig: FormLayoutConfig;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  startEdit: () => void;
  cancelEdit: () => void;
  swapWith: (fieldIdA: string, fieldIdB: string) => void;
  moveToCell: (fieldId: string, cell: string) => void;
  changeColSpan: (fieldId: string, colSpan: number) => void;
  addRow: () => void;
  removeRow: () => void;
  updateOverride: (
    fieldId: string,
    patch: Partial<{ type: FieldType; label: string; required: boolean }>,
  ) => void;
  addCustomField: (input: { label: string; type: FieldType }) => string | null;
  removeCustomField: (fieldId: string) => void;
  isSaving: boolean;
  isLoading: boolean;
}

export const FormLayoutEditorContext = createContext<FormLayoutEditorContextValue | null>(null);
