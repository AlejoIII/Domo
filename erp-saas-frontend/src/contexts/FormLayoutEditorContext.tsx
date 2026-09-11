import {
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, RotateCcw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  buildDefaultLayout,
  normalizeLayoutGrid,
  addCustomField,
  removeCustomField,
  type ConfigurableEntityId,
} from '@/config/field-definitions';
import type { FieldType, FormLayoutConfig } from '@/types/form-layout.types';
import {
  FormLayoutEditorContext,
  type FormLayoutEditorContextValue,
} from '@/contexts/form-layout-editor-context';
import { useFormLayout } from '@/hooks/useFormLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { resetFormLayout, saveFormLayout } from '@/services/form-layout.service';
import {
  moveFieldToCell,
  setFieldColSpan,
  swapFields,
  updateFieldOverride,
  addLayoutRow,
  removeLayoutRow,
} from '@/config/field-definitions';

export function FormLayoutEditorProvider({
  entityId,
  children,
}: {
  entityId: ConfigurableEntityId;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { config: savedConfig, isLoading } = useFormLayout(entityId);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<FormLayoutConfig | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const activeConfig = editMode && draft ? draft : savedConfig;

  const startEdit = useCallback(() => {
    setDraft(normalizeLayoutGrid(structuredClone(savedConfig)));
    setEditMode(true);
    setSelectedFieldId(null);
  }, [savedConfig]);

  const cancelEdit = useCallback(() => {
    setDraft(null);
    setEditMode(false);
    setSelectedFieldId(null);
  }, []);

  const layoutDirty = editMode && draft != null
    && JSON.stringify(draft) !== JSON.stringify(savedConfig);
  const { requestLeave, dialog: layoutDialog } = useUnsavedChangesGuard(!!layoutDirty);

  const handleCancelEdit = useCallback(() => {
    requestLeave(cancelEdit);
  }, [requestLeave, cancelEdit]);

  const saveMutation = useMutation({
    mutationFn: () => saveFormLayout(entityId, draft!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-layout', entityId] });
      setEditMode(false);
      setDraft(null);
      setSelectedFieldId(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetFormLayout(entityId),
    onSuccess: () => {
      const defaults = buildDefaultLayout(entityId);
      setDraft(defaults);
      setSelectedFieldId(null);
      queryClient.invalidateQueries({ queryKey: ['form-layout', entityId] });
    },
  });

  const patchDraft = useCallback((updater: (prev: FormLayoutConfig) => FormLayoutConfig) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  const swapWith = useCallback((fieldIdA: string, fieldIdB: string) => {
    patchDraft((prev) => swapFields(prev, fieldIdA, fieldIdB));
  }, [patchDraft]);

  const moveToCell = useCallback((fieldId: string, cell: string) => {
    patchDraft((prev) => moveFieldToCell(prev, fieldId, cell));
  }, [patchDraft]);

  const changeColSpan = useCallback((fieldId: string, colSpan: number) => {
    patchDraft((prev) => setFieldColSpan(prev, entityId, fieldId, colSpan));
  }, [entityId, patchDraft]);

  const addRow = useCallback(() => {
    patchDraft((prev) => addLayoutRow(prev));
  }, [patchDraft]);

  const removeRow = useCallback(() => {
    patchDraft((prev) => removeLayoutRow(prev));
  }, [patchDraft]);

  const updateOverride = useCallback((
    fieldId: string,
    patch: Partial<{ type: FieldType; label: string; required: boolean }>,
  ) => {
    patchDraft((prev) => updateFieldOverride(prev, entityId, fieldId, patch));
  }, [entityId, patchDraft]);

  const addCustomFieldAction = useCallback((input: { label: string; type: FieldType }): string | null => {
    let error: string | null = null;
    setDraft((prev) => {
      if (!prev) return prev;
      const result = addCustomField(prev, input);
      if (!result.ok) {
        error = result.error;
        return prev;
      }
      setSelectedFieldId(result.fieldId);
      return result.config;
    });
    return error;
  }, []);

  const removeCustomFieldAction = useCallback((fieldId: string) => {
    patchDraft((prev) => removeCustomField(prev, fieldId));
    setSelectedFieldId((current) => (current === fieldId ? null : current));
  }, [patchDraft]);

  const value = useMemo<FormLayoutEditorContextValue>(() => ({
    entityId,
    editMode,
    activeConfig,
    selectedFieldId,
    setSelectedFieldId,
    startEdit,
    cancelEdit,
    swapWith,
    moveToCell,
    changeColSpan,
    addRow,
    removeRow,
    updateOverride,
    addCustomField: addCustomFieldAction,
    removeCustomField: removeCustomFieldAction,
    isSaving: saveMutation.isPending,
    isLoading,
  }), [
    entityId,
    editMode,
    activeConfig,
    selectedFieldId,
    startEdit,
    cancelEdit,
    swapWith,
    moveToCell,
    changeColSpan,
    addRow,
    removeRow,
    updateOverride,
    addCustomFieldAction,
    removeCustomFieldAction,
    saveMutation.isPending,
    isLoading,
  ]);

  return (
    <FormLayoutEditorContext.Provider value={value}>
      {layoutDialog}
      {children}
      {editMode && (
        <FormLayoutEditBar
          onSave={() => saveMutation.mutate()}
          onCancel={handleCancelEdit}
          onReset={() => resetMutation.mutate()}
          saving={saveMutation.isPending}
          resetting={resetMutation.isPending}
        />
      )}
    </FormLayoutEditorContext.Provider>
  );
}

function FormLayoutEditBar({
  onSave,
  onCancel,
  onReset,
  saving,
  resetting,
}: {
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  saving: boolean;
  resetting: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/30 bg-card/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-primary">
          Modo personalización — arrastra campos, añade campos personalizados y ajusta el diseño
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" type="button" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button variant="secondary" type="button" loading={resetting} onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </Button>
          <Button type="button" loading={saving} onClick={onSave}>
            <Save className="h-4 w-4" />
            Guardar diseño
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormLayoutEditToggle() {
  const ctx = useContext(FormLayoutEditorContext);
  const { hasPermission } = usePermissions();

  if (!ctx || !hasPermission('settings.write') || ctx.editMode) return null;

  return (
    <Button variant="secondary" type="button" onClick={ctx.startEdit}>
      <LayoutGrid className="h-4 w-4" />
      Personalizar ficha
    </Button>
  );
}

