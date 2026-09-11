import { useState, useMemo } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { ArrowLeftRight, AlertCircle, GripVertical, Info, Minus, Plus, Rows3, Sparkles, Trash2 } from 'lucide-react';import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  FIELD_TYPE_LABELS,
  cellKey,
  canRemoveLayoutRow,
  getAvailableFields,
  canAddCustomField,
  getMaxColSpan,
  isCustomFieldId,
  listPlacedFields,
  parseCellKey,
  resolveColSpan,
  resolveFieldLabel,
  resolveFieldPlaceholder,
  resolveFieldRequired,
  resolveFieldType,
  type ConfigurableEntityId,
} from '@/config/field-definitions';
import { FormLabel } from '@/components/forms/FormLabel';
import type { FieldType, FormLayoutConfig } from '@/types/form-layout.types';
import { useOptionalFormLayoutEditor } from '@/hooks/useFormLayoutEditor';

interface ConfigurableFormGridProps {
  entityId: ConfigurableEntityId;
  config: FormLayoutConfig;
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

function inputPropsForType(type: ReturnType<typeof resolveFieldType>) {
  switch (type) {
    case 'integer':
      return { type: 'number' as const, step: '1' };
    case 'decimal':
      return { type: 'number' as const, step: '0.01' };
    case 'email':
      return { type: 'email' as const };
    case 'phone':
      return { type: 'tel' as const };
    case 'date':
      return { type: 'date' as const };
    default:
      return { type: 'text' as const };
  }
}

type GridItem =
  | { kind: 'field'; fieldId: string; row: number; col: number; colSpan: number; anchorKey: string }
  | { kind: 'empty'; row: number; col: number; anchorKey: string }
  | { kind: 'covered'; anchorKey: string };

function buildGridItems(
  entityId: ConfigurableEntityId,
  config: FormLayoutConfig,
  editMode: boolean,
): GridItem[] {
  const occupied = new Set<string>();
  const items: GridItem[] = [];

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const anchorKey = cellKey(r, c);
      if (occupied.has(anchorKey)) {
        items.push({ kind: 'covered', anchorKey });
        continue;
      }

      const fieldId = config.placements[anchorKey];
      if (!fieldId) {
        if (editMode) {
          items.push({ kind: 'empty', row: r, col: c, anchorKey });
        } else {
          items.push({ kind: 'covered', anchorKey });
        }
        continue;
      }

      const colSpan = resolveColSpan(entityId, fieldId, config);
      for (let i = 0; i < colSpan; i++) {
        occupied.add(cellKey(r, c + i));
      }
      items.push({ kind: 'field', fieldId, row: r, col: c, colSpan, anchorKey });
    }
  }

  return items;
}

function FieldEditorPanel({
  entityId,
  config,
  fieldId,
}: {
  entityId: ConfigurableEntityId;
  config: FormLayoutConfig;
  fieldId: string;
}) {
  const editor = useOptionalFormLayoutEditor();
  if (!editor) return null;

  const label = resolveFieldLabel(entityId, fieldId, config);
  const colSpan = resolveColSpan(entityId, fieldId, config);
  const maxColSpan = getMaxColSpan(config, entityId, fieldId);
  const canExpand = colSpan < maxColSpan;
  const override = config.overrides[fieldId];
  const others = listPlacedFields(entityId, config).filter((f) => f.fieldId !== fieldId);
  const isCustom = isCustomFieldId(fieldId);

  return (
    <div
      className="min-w-0 rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
          Editando: {label}
          {isCustom && (
            <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium normal-case">
              Personalizado
            </span>
          )}
        </p>
        {isCustom && (
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-red-600 hover:text-red-700"
            onClick={() => editor.removeCustomField(fieldId)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Intercambiar posición con</span>
          </label>
          <select
            className="w-full min-w-0 max-w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              const target = e.target.value;
              if (target) editor.swapWith(fieldId, target);
              e.target.value = '';
            }}
          >
            <option value="">Seleccionar campo…</option>
            {others.map((f) => (
              <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ancho en la ficha</label>
          <div className="flex max-w-full items-center gap-2">
            <button
              type="button"
              disabled={colSpan <= 1}
              onClick={() => editor.changeColSpan(fieldId, colSpan - 1)}
              className="shrink-0 rounded-lg border border-border/70 p-2 hover:bg-muted disabled:opacity-40"
              aria-label="Reducir ancho"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">
              {colSpan} / {config.cols} {colSpan === 1 ? 'columna' : 'columnas'}
            </span>
            <button
              type="button"
              disabled={!canExpand}
              onClick={() => editor.changeColSpan(fieldId, colSpan + 1)}
              className="shrink-0 rounded-lg border border-border/70 p-2 hover:bg-muted disabled:opacity-40"
              aria-label="Aumentar ancho"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Para ampliar el ancho, las columnas contiguas deben estar libres.
              {!canExpand && colSpan < config.cols && (
                <> Mueve o intercambia el campo que ocupa la columna de al lado.</>
              )}
            </span>
          </p>
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Etiqueta</label>
          <input
            className="w-full min-w-0 max-w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            value={override?.label ?? label}
            onChange={(e) => editor.updateOverride(fieldId, { label: e.target.value })}
          />
        </div>

        <div className="min-w-0 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo de dato</label>
          <select
            className="w-full min-w-0 max-w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            value={override?.type ?? resolveFieldType(entityId, fieldId, config)}
            onChange={(e) => editor.updateOverride(fieldId, { type: e.target.value as FieldType })}
            disabled={!isCustom}
          >
            {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([value, lbl]) => (
              <option key={value} value={value}>{lbl}</option>
            ))}
          </select>
          {!isCustom && (
            <p className="text-xs text-muted-foreground">Solo puedes cambiar el tipo en campos personalizados.</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!override?.required}
          onChange={(e) => editor.updateOverride(fieldId, { required: e.target.checked })}
        />
        Campo obligatorio
      </label>
    </div>
  );
}

const CUSTOM_FIELD_TYPES: FieldType[] = ['text', 'textarea', 'date', 'email', 'phone', 'integer', 'decimal'];

function AddCustomFieldBar() {
  const editor = useOptionalFormLayoutEditor();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [error, setError] = useState<string | null>(null);

  const placementStatus = useMemo(() => {
    if (!editor) return { canAdd: false as const, message: '' };
    return canAddCustomField(editor.activeConfig, type);
  }, [editor, type]);

  if (!editor) return null;

  const canAdd = placementStatus.canAdd;

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const addError = editor.addCustomField({ label: trimmed, type });
    if (addError) {
      setError(addError);
      return;
    }
    setError(null);
    setLabel('');
    setType('text');
  };

  return (
    <div
      className="min-w-0 rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-3"
      style={{ gridColumn: '1 / -1' }}
    >
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Añadir campo personalizado
      </p>
      <div className="flex min-w-0 flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Etiqueta</label>
          <input
            className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            placeholder="Ej. Referencia interna"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>
        <div className="min-w-[140px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <select
            className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            value={type}
            onChange={(e) => {
              setType(e.target.value as FieldType);
              setError(null);
            }}
          >
            {CUSTOM_FIELD_TYPES.map((value) => (
              <option key={value} value={value}>{FIELD_TYPE_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={!label.trim() || !canAdd}
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </div>
      {!canAdd && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{placementStatus.message}</span>
        </p>
      )}
      {canAdd && placementStatus.needsNewRow && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Se añadirá una fila nueva automáticamente al crear el campo.</span>
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function ConfigurableFormGrid({
  entityId,
  config,
  register,
  errors,
}: ConfigurableFormGridProps) {
  const editor = useOptionalFormLayoutEditor();
  const editMode = editor?.editMode ?? false;
  const selectedFieldId = editor?.selectedFieldId ?? null;
  const items = buildGridItems(entityId, config, editMode);
  const unplacedFields = editMode ? getAvailableFields(entityId, config) : [];
  const canRemoveRow = editMode && canRemoveLayoutRow(config);

  const handleDragStart = (fieldId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnCell = (targetCell: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!editor) return;
    const fieldId = e.dataTransfer.getData('text/plain');
    if (!fieldId) return;
    editor.moveToCell(fieldId, targetCell);
    editor.setSelectedFieldId(fieldId);
  };

  return (
    <div
      className={cn(
        'grid min-w-0 gap-4 pt-2',
        editMode && 'rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-3 pb-24',
      )}
      style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
    >
      {editMode && <AddCustomFieldBar />}
      {editMode && unplacedFields.length > 0 && (
        <div
          className="min-w-0 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3"
          style={{ gridColumn: '1 / -1' }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Campos sin colocar — arrastra a una celda libre
          </p>
          <div className="flex flex-wrap gap-2">
            {unplacedFields.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(field.id, e)}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {field.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {items.map((item) => {
        if (item.kind === 'covered') {
          return null;
        }

        if (item.kind === 'empty') {
          const { row, col } = parseCellKey(item.anchorKey);
          return (
            <div
              key={item.anchorKey}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnCell(item.anchorKey, e)}
              className="flex min-h-[72px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground"
            >
              <span className="font-medium">Fila {row + 1}, col {col + 1}</span>
              <span>Soltar aquí</span>
            </div>
          );
        }

        const { fieldId, colSpan, anchorKey } = item;
        const fieldType = resolveFieldType(entityId, fieldId, config);
        const label = resolveFieldLabel(entityId, fieldId, config);
        const required = resolveFieldRequired(entityId, fieldId, config);
        const placeholder = resolveFieldPlaceholder(entityId, fieldId, config);
        const error = errors[fieldId]?.message as string | undefined;
        const isSelected = selectedFieldId === fieldId;
        const { row, col } = parseCellKey(anchorKey);

        const fieldContent = fieldType === 'textarea' ? (
          <>
            <FormLabel required={required}>{label}</FormLabel>
            <textarea
              className="mt-1 w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              rows={4}
              placeholder={placeholder}
              readOnly={editMode}
              tabIndex={editMode ? -1 : undefined}
              aria-required={required || undefined}
              {...register(fieldId)}
            />
          </>
        ) : (
          <Input
            label={label}
            required={required}
            error={error}
            placeholder={placeholder}
            readOnly={editMode}
            tabIndex={editMode ? -1 : undefined}
            {...inputPropsForType(fieldType)}
            {...register(fieldId)}
          />
        );

        return (
          <div
            key={fieldId}
            style={{ gridColumn: `span ${colSpan}` }}
            className={cn('relative min-w-0', editMode && 'cursor-pointer')}
            onClick={() => editMode && editor?.setSelectedFieldId(fieldId)}
            onDragOver={(e) => editMode && e.preventDefault()}
            onDrop={(e) => editMode && handleDropOnCell(anchorKey, e)}
          >
            <div
              className={cn(
                'min-w-0 rounded-xl transition',
                editMode && 'ring-2 ring-offset-2 ring-offset-background',
                editMode && (isSelected ? 'ring-primary bg-primary/5' : 'ring-transparent hover:ring-primary/30'),
              )}
            >
              {editMode && (
                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(fieldId, e);
                  }}
                  className="mb-1 flex items-center gap-1 rounded-t-lg bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary"
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab active:cursor-grabbing" />
                  <span className="truncate">
                    Celda {row + 1}-{col + 1}
                    {colSpan > 1 && ` · ${colSpan} cols`}
                    {isCustomFieldId(fieldId) && ' · personalizado'}
                  </span>
                </div>
              )}
              <div className={cn('min-w-0', editMode && 'pointer-events-none px-2 pb-2')}>
                {fieldContent}
                {!editMode && fieldType === 'textarea' && error && (
                  <p className="mt-1 text-xs text-red-600">{error}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {editMode && editor && (
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 border-t border-dashed border-primary/20 pt-4"
          style={{ gridColumn: '1 / -1' }}
        >
          <Button
            type="button"
            variant="secondary"
            disabled={config.rows >= 12}
            onClick={() => editor.addRow()}
          >
            <Plus className="h-4 w-4" />
            Añadir fila
          </Button>
          {canRemoveRow && (
            <Button type="button" variant="ghost" onClick={() => editor.removeRow()}>
              <Minus className="h-4 w-4" />
              Quitar última fila
            </Button>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Rows3 className="h-3.5 w-3.5 shrink-0" />
            {config.rows} filas × {config.cols} columnas — añade filas para mover campos a otras posiciones
          </p>
        </div>
      )}
      {editMode && selectedFieldId && (
        <div className="min-w-0" style={{ gridColumn: '1 / -1' }}>
          <FieldEditorPanel
            entityId={entityId}
            config={config}
            fieldId={selectedFieldId}
          />
        </div>
      )}
    </div>
  );
}
