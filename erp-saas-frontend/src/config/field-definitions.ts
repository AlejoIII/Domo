import type { FieldType, FormLayoutConfig, CustomFieldDefinition } from '@/types/form-layout.types';
import type { EntityFieldDefinition } from '@/types/form-layout.types';

export function isCustomFieldId(fieldId: string) {
  return fieldId.startsWith('cf_');
}

export function createCustomFieldId() {
  return `cf_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export const CONFIGURABLE_ENTITIES = [
  { id: 'clients', label: 'Clientes' },
  { id: 'products', label: 'Productos' },
  { id: 'suppliers', label: 'Proveedores' },
  { id: 'employees', label: 'Empleados' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'invoices', label: 'Facturas' },
  { id: 'quotes', label: 'Presupuestos' },
  { id: 'purchaseOrders', label: 'Órdenes de compra' },
  { id: 'categories', label: 'Categorías' },
  { id: 'warehouses', label: 'Almacenes' },
] as const;

export type ConfigurableEntityId = (typeof CONFIGURABLE_ENTITIES)[number]['id'];

/** Rutas de formulario «nuevo» para personalizar fichas desde Configuración */
export const ENTITY_FORM_ROUTES: Record<ConfigurableEntityId, string> = {
  clients: '/clients/new',
  products: '/products/new',
  suppliers: '/suppliers/new',
  employees: '/hr/employees/new',
  orders: '/orders/new',
  invoices: '/invoices/new',
  quotes: '/quotes/new',
  purchaseOrders: '/purchase-orders/new',
  categories: '/categories/new',
  warehouses: '/warehouses/new',
};

export const ENTITY_FIELD_DEFINITIONS: Record<ConfigurableEntityId, EntityFieldDefinition[]> = {
  clients: [
    { id: 'name', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Construcciones Vera SL' },
    { id: 'email', label: 'Email', defaultType: 'email', placeholder: 'contacto@empresa.com' },
    { id: 'phone', label: 'Teléfono', defaultType: 'phone', placeholder: '600 123 456' },
    { id: 'taxId', label: 'NIF/CIF', defaultType: 'text', placeholder: 'B12345678' },
    { id: 'address', label: 'Dirección', defaultType: 'text', placeholder: 'Calle Mayor 12, 3º B' },
    { id: 'city', label: 'Ciudad', defaultType: 'text', placeholder: 'Madrid' },
    { id: 'postalCode', label: 'Código postal', defaultType: 'text', placeholder: '28001' },
    { id: 'country', label: 'País', defaultType: 'text', placeholder: 'España' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Condiciones acordadas, persona de contacto, horario de entrega…' },
  ],
  products: [
    { id: 'code', label: 'Código', defaultType: 'text', required: true, placeholder: 'PRD-001' },
    { id: 'name', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Tornillo hexagonal M8' },
    { id: 'category', label: 'Categoría', defaultType: 'text', placeholder: 'Ferretería' },
    { id: 'barcode', label: 'Código barras', defaultType: 'text', placeholder: '8412345678905' },
    { id: 'description', label: 'Descripción', defaultType: 'textarea', placeholder: 'Material, medidas, acabado y cualquier detalle útil en la venta' },
    { id: 'price', label: 'Precio venta', defaultType: 'decimal', placeholder: '19.95' },
    { id: 'cost', label: 'Coste', defaultType: 'decimal', placeholder: '12.40' },
    { id: 'stock', label: 'Stock actual', defaultType: 'integer', placeholder: '0' },
    { id: 'minStock', label: 'Stock mínimo', defaultType: 'integer', placeholder: '5' },
    { id: 'unit', label: 'Unidad', defaultType: 'text', placeholder: 'ud, caja, kg, m…' },
  ],
  suppliers: [
    { id: 'name', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Suministros Ibéricos SA' },
    { id: 'email', label: 'Email', defaultType: 'email', placeholder: 'pedidos@proveedor.com' },
    { id: 'phone', label: 'Teléfono', defaultType: 'phone', placeholder: '910 123 456' },
    { id: 'taxId', label: 'NIF/CIF', defaultType: 'text', placeholder: 'A87654321' },
    { id: 'address', label: 'Dirección', defaultType: 'text', placeholder: 'Polígono Las Arenas, nave 7' },
    { id: 'city', label: 'Ciudad', defaultType: 'text', placeholder: 'Valencia' },
    { id: 'postalCode', label: 'Código postal', defaultType: 'text', placeholder: '46001' },
    { id: 'country', label: 'País', defaultType: 'text', placeholder: 'España' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Plazos de entrega, descuentos por volumen, condiciones de pago…' },
  ],
  employees: [
    { id: 'firstName', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Lucía' },
    { id: 'lastName', label: 'Apellidos', defaultType: 'text', required: true, placeholder: 'Ramírez Ortega' },
    { id: 'email', label: 'Email', defaultType: 'email', placeholder: 'lucia.ramirez@empresa.com' },
    { id: 'phone', label: 'Teléfono', defaultType: 'phone', placeholder: '600 123 456' },
    { id: 'department', label: 'Departamento', defaultType: 'text', placeholder: 'Administración' },
    { id: 'jobTitle', label: 'Cargo', defaultType: 'text', placeholder: 'Responsable de compras' },
    { id: 'hireDate', label: 'Fecha alta', defaultType: 'date' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Jornada, formación, observaciones internas…' },
  ],
  orders: [
    { id: 'orderDate', label: 'Fecha', defaultType: 'date', required: true },
    { id: 'taxRate', label: 'IVA (%)', defaultType: 'decimal', placeholder: '21' },
    { id: 'trackingNumber', label: 'Nº seguimiento / albarán', defaultType: 'text', placeholder: 'ALB-2026-0042' },
    { id: 'deliveryAddress', label: 'Dirección de entrega', defaultType: 'text', placeholder: 'Calle Mayor 12, 28001 Madrid' },
    { id: 'deliveryNotes', label: 'Notas de entrega', defaultType: 'textarea', placeholder: 'Horario de recepción, muelle de carga, persona de contacto…' },
    { id: 'notes', label: 'Notas internas', defaultType: 'textarea', placeholder: 'Visible solo para tu equipo' },
  ],
  invoices: [
    { id: 'orderId', label: 'Pedido (opcional)', defaultType: 'text', placeholder: 'ID del pedido que se factura' },
    { id: 'issueDate', label: 'Fecha emisión', defaultType: 'date', required: true },
    { id: 'dueDate', label: 'Vencimiento', defaultType: 'date' },
    { id: 'taxRate', label: 'IVA (%)', defaultType: 'decimal', placeholder: '21' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Forma de pago, número de cuenta, condiciones… se imprime en la factura' },
  ],
  quotes: [
    { id: 'validUntil', label: 'Válido hasta', defaultType: 'date' },
    { id: 'taxRate', label: 'IVA (%)', defaultType: 'decimal', placeholder: '21' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Plazo de entrega, condiciones… se imprime en el presupuesto' },
  ],
  purchaseOrders: [
    { id: 'expectedDate', label: 'Fecha esperada', defaultType: 'date' },
    { id: 'taxRate', label: 'IVA (%)', defaultType: 'decimal', placeholder: '21' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Referencia del proveedor, instrucciones de entrega…' },
  ],
  categories: [
    { id: 'name', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Ferretería' },
    { id: 'description', label: 'Descripción', defaultType: 'textarea', placeholder: 'Qué productos agrupa esta categoría' },
  ],
  warehouses: [
    { id: 'code', label: 'Código', defaultType: 'text', required: true, placeholder: 'ALM-01' },
    { id: 'name', label: 'Nombre', defaultType: 'text', required: true, placeholder: 'Almacén central' },
    { id: 'address', label: 'Dirección', defaultType: 'text', placeholder: 'Polígono Las Arenas, nave 7' },
    { id: 'city', label: 'Ciudad', defaultType: 'text', placeholder: 'Madrid' },
    { id: 'notes', label: 'Notas', defaultType: 'textarea', placeholder: 'Horario, responsable, restricciones de acceso…' },
  ],
};

/** Ejemplo genérico cuando el campo no define uno propio (campos personalizados). */
const PLACEHOLDER_BY_TYPE: Record<FieldType, string> = {
  text: 'Ejemplo de texto',
  email: 'nombre@empresa.com',
  phone: '600 123 456',
  integer: '0',
  decimal: '0.00',
  textarea: 'Detalles, observaciones o condiciones…',
  date: '',
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  email: 'Email',
  integer: 'Número entero',
  decimal: 'Número decimal',
  textarea: 'Texto largo',
  date: 'Fecha',
  phone: 'Teléfono',
};

export function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

export function parseCellKey(key: string) {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
}

export function buildDefaultLayout(entityId: ConfigurableEntityId): FormLayoutConfig {
  const fields = ENTITY_FIELD_DEFINITIONS[entityId];
  const cols = 2;
  const rows = Math.max(4, Math.ceil(fields.length / cols));
  const placements: Record<string, string | null> = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      placements[cellKey(r, c)] = null;
    }
  }

  fields.forEach((field, index) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    placements[cellKey(r, c)] = field.id;
  });

  const overrides: FormLayoutConfig['overrides'] = {};
  for (const field of fields) {
    const isTextarea = field.defaultType === 'textarea';
    overrides[field.id] = {
      type: field.defaultType,
      label: field.label,
      required: field.required,
      colSpan: isTextarea ? cols : 1,
    };
  }

  return { rows, cols, placements, overrides, customFields: [] };
}

export function listCustomFieldDefinitions(config: FormLayoutConfig): CustomFieldDefinition[] {
  return config.customFields ?? [];
}

export function listAllFieldDefinitions(
  entityId: ConfigurableEntityId,
  config?: FormLayoutConfig,
): EntityFieldDefinition[] {
  const staticFields = ENTITY_FIELD_DEFINITIONS[entityId];
  const custom = (config?.customFields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    defaultType: field.type,
    required: field.required,
    isCustom: true as const,
  }));
  return [...staticFields, ...custom];
}

const MAX_LAYOUT_ROWS = 12;

export function canAddCustomField(
  config: FormLayoutConfig,
  type: FieldType,
): { canAdd: true; needsNewRow: boolean } | { canAdd: false; message: string } {
  const needsFullRow = type === 'textarea';

  if (needsFullRow) {
    for (let r = 0; r < config.rows; r++) {
      if (isRowEmpty(config, r)) return { canAdd: true, needsNewRow: false };
    }
    if (config.rows < MAX_LAYOUT_ROWS) return { canAdd: true, needsNewRow: true };
    return {
      canAdd: false,
      message: 'No hay una fila vacía para un texto largo. Libera una fila completa o reorganiza los campos (máximo 12 filas).',
    };
  }

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (!config.placements[cellKey(r, c)]) return { canAdd: true, needsNewRow: false };
    }
  }

  if (config.rows < MAX_LAYOUT_ROWS) return { canAdd: true, needsNewRow: true };
  return {
    canAdd: false,
    message: 'No quedan celdas libres. Mueve o elimina campos para hacer espacio (máximo 12 filas).',
  };
}

export function addCustomField(
  config: FormLayoutConfig,
  input: { label: string; type: FieldType },
):
  | { ok: true; config: FormLayoutConfig; fieldId: string }
  | { ok: false; error: string } {
  const trimmed = input.label.trim();
  if (!trimmed) {
    return { ok: false, error: 'Indica una etiqueta para el campo.' };
  }

  const placement = canAddCustomField(config, input.type);
  if (!placement.canAdd) {
    return { ok: false, error: placement.message };
  }

  const workingConfig = placement.needsNewRow ? addLayoutRow(config) : config;

  let targetCell: string | null = null;
  if (input.type === 'textarea') {
    for (let r = 0; r < workingConfig.rows; r++) {
      if (isRowEmpty(workingConfig, r)) {
        targetCell = cellKey(r, 0);
        break;
      }
    }
  } else {
    for (let r = 0; r < workingConfig.rows; r++) {
      for (let c = 0; c < workingConfig.cols; c++) {
        const key = cellKey(r, c);
        if (!workingConfig.placements[key]) {
          targetCell = key;
          break;
        }
      }
      if (targetCell) break;
    }
  }

  if (!targetCell) {
    return { ok: false, error: 'No se pudo colocar el campo. Libera espacio en la ficha e inténtalo de nuevo.' };
  }

  const id = createCustomFieldId();
  const field: CustomFieldDefinition = {
    id,
    label: trimmed,
    type: input.type,
    required: false,
  };

  const placements = { ...workingConfig.placements, [targetCell]: id };

  return {
    ok: true,
    fieldId: id,
    config: {
      ...workingConfig,
      placements,
      customFields: [...(workingConfig.customFields ?? []), field],
      overrides: {
        ...workingConfig.overrides,
        [id]: {
          type: input.type,
          label: field.label,
          required: false,
          colSpan: input.type === 'textarea' ? workingConfig.cols : 1,
        },
      },
    },
  };
}

export function removeCustomField(config: FormLayoutConfig, fieldId: string): FormLayoutConfig {
  if (!isCustomFieldId(fieldId)) return config;

  const placements = { ...config.placements };
  for (const [key, value] of Object.entries(placements)) {
    if (value === fieldId) placements[key] = null;
  }

  const { [fieldId]: _removed, ...overrides } = config.overrides;

  return {
    ...config,
    customFields: (config.customFields ?? []).filter((f) => f.id !== fieldId),
    placements,
    overrides,
  };
}

export function getFieldDef(entityId: ConfigurableEntityId, fieldId: string, config?: FormLayoutConfig) {
  const staticDef = ENTITY_FIELD_DEFINITIONS[entityId].find((f) => f.id === fieldId);
  if (staticDef) return staticDef;
  const custom = config?.customFields?.find((f) => f.id === fieldId);
  if (!custom) return undefined;
  return {
    id: custom.id,
    label: custom.label,
    defaultType: custom.type,
    required: custom.required,
    isCustom: true as const,
  };
}

export function getPlacedFieldIds(config: FormLayoutConfig) {
  return Object.values(config.placements).filter(Boolean) as string[];
}

export function getAvailableFields(entityId: ConfigurableEntityId, config: FormLayoutConfig) {
  const placed = new Set(getPlacedFieldIds(config));
  return listAllFieldDefinitions(entityId, config).filter((f) => !placed.has(f.id));
}

export function resolveFieldType(
  entityId: ConfigurableEntityId,
  fieldId: string,
  config: FormLayoutConfig,
): FieldType {
  return config.overrides[fieldId]?.type
    ?? getFieldDef(entityId, fieldId, config)?.defaultType
    ?? 'text';
}

export function resolveFieldLabel(
  entityId: ConfigurableEntityId,
  fieldId: string,
  config: FormLayoutConfig,
) {
  return config.overrides[fieldId]?.label
    ?? getFieldDef(entityId, fieldId, config)?.label
    ?? fieldId;
}

export function resolveFieldPlaceholder(
  entityId: ConfigurableEntityId,
  fieldId: string,
  config: FormLayoutConfig,
): string {
  const def = getFieldDef(entityId, fieldId, config);
  // El tipo puede haberse cambiado desde el editor, así que el genérico manda sobre el tipo actual
  const type = resolveFieldType(entityId, fieldId, config);
  if (def?.placeholder && def.defaultType === type) return def.placeholder;
  return PLACEHOLDER_BY_TYPE[type];
}

export function resolveFieldRequired(
  entityId: ConfigurableEntityId,
  fieldId: string,
  config: FormLayoutConfig,
): boolean {
  const override = config.overrides[fieldId]?.required;
  if (override !== undefined) return override;
  return getFieldDef(entityId, fieldId, config)?.required ?? false;
}

export function resolveColSpan(
  entityId: ConfigurableEntityId,
  fieldId: string,
  config: FormLayoutConfig,
): number {
  const span = config.overrides[fieldId]?.colSpan;
  if (span != null) return Math.min(Math.max(1, span), config.cols);
  const type = resolveFieldType(entityId, fieldId, config);
  if (type === 'textarea') return config.cols;
  return 1;
}

export function findFieldCell(config: FormLayoutConfig, fieldId: string): string | null {
  for (const [key, id] of Object.entries(config.placements)) {
    if (id === fieldId) return key;
  }
  return null;
}

export function swapFields(
  config: FormLayoutConfig,
  fieldIdA: string,
  fieldIdB: string,
): FormLayoutConfig {
  const cellA = findFieldCell(config, fieldIdA);
  const cellB = findFieldCell(config, fieldIdB);
  if (!cellA || !cellB) return config;
  return {
    ...config,
    placements: {
      ...config.placements,
      [cellA]: fieldIdB,
      [cellB]: fieldIdA,
    },
  };
}

export function moveFieldToCell(
  config: FormLayoutConfig,
  fieldId: string,
  targetCell: string,
): FormLayoutConfig {
  const sourceCell = findFieldCell(config, fieldId);
  if (sourceCell === targetCell) return config;

  const placements = { ...config.placements };
  const displaced = placements[targetCell] ?? null;

  if (sourceCell) {
    placements[targetCell] = fieldId;
    placements[sourceCell] = displaced;
  } else {
    placements[targetCell] = fieldId;
  }

  return { ...config, placements };
}

export function addLayoutRow(config: FormLayoutConfig): FormLayoutConfig {
  if (config.rows >= MAX_LAYOUT_ROWS) return config;

  const newRow = config.rows;
  const placements = { ...config.placements };
  for (let c = 0; c < config.cols; c++) {
    placements[cellKey(newRow, c)] = null;
  }

  return { ...config, rows: config.rows + 1, placements };
}

export function isRowEmpty(config: FormLayoutConfig, row: number): boolean {
  for (let c = 0; c < config.cols; c++) {
    if (config.placements[cellKey(row, c)]) return false;
  }
  return true;
}

export function removeLayoutRow(config: FormLayoutConfig): FormLayoutConfig {
  if (config.rows <= 1) return config;

  const lastRow = config.rows - 1;
  if (!isRowEmpty(config, lastRow)) return config;

  const placements = { ...config.placements };
  for (let c = 0; c < config.cols; c++) {
    delete placements[cellKey(lastRow, c)];
  }

  return { ...config, rows: config.rows - 1, placements };
}

export function canRemoveLayoutRow(config: FormLayoutConfig): boolean {
  return config.rows > 1 && isRowEmpty(config, config.rows - 1);
}

export function normalizeLayoutGrid(config: FormLayoutConfig): FormLayoutConfig {
  const placements = { ...config.placements };
  let maxRow = config.rows - 1;

  for (const key of Object.keys(placements)) {
    const { row } = parseCellKey(key);
    if (!Number.isNaN(row)) maxRow = Math.max(maxRow, row);
  }

  const rows = Math.max(config.rows, maxRow + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const key = cellKey(r, c);
      if (!(key in placements)) placements[key] = null;
    }
  }

  return {
    rows,
    cols: config.cols,
    placements,
    overrides: config.overrides ?? {},
    customFields: config.customFields ?? [],
  };
}

/** Payload limpio para API (evita propiedades extra rechazadas por el backend). */
export function sanitizeFormLayoutConfig(config: FormLayoutConfig): FormLayoutConfig {
  const overrides: FormLayoutConfig['overrides'] = {};
  for (const [fieldId, value] of Object.entries(config.overrides ?? {})) {
    if (!value?.type) continue;
    overrides[fieldId] = {
      type: value.type,
      ...(value.label !== undefined ? { label: value.label } : {}),
      ...(value.required !== undefined ? { required: value.required } : {}),
      ...(value.colSpan !== undefined ? { colSpan: value.colSpan } : {}),
    };
  }

  const customFields = (config.customFields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    ...(field.required !== undefined ? { required: field.required } : {}),
  }));

  return {
    rows: config.rows,
    cols: config.cols,
    placements: config.placements,
    overrides,
    ...(customFields.length > 0 ? { customFields } : {}),
  };
}

export function getMaxColSpan(
  config: FormLayoutConfig,
  entityId: ConfigurableEntityId,
  fieldId: string,
): number {
  const cell = findFieldCell(config, fieldId);
  if (!cell) return 1;

  const { row, col } = parseCellKey(cell);
  const occupiedBy = new Map<string, string>();

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const anchorKey = cellKey(r, c);
      const anchorField = config.placements[anchorKey];
      if (!anchorField) continue;
      const span = resolveColSpan(entityId, anchorField, config);
      for (let i = 0; i < span; i++) {
        occupiedBy.set(cellKey(r, c + i), anchorField);
      }
    }
  }

  let maxSpan = 0;
  for (let c = col; c < config.cols; c++) {
    const occupant = occupiedBy.get(cellKey(row, c));
    if (!occupant || occupant === fieldId) {
      maxSpan++;
    } else {
      break;
    }
  }

  return Math.max(1, maxSpan);
}

export function setFieldColSpan(
  config: FormLayoutConfig,
  entityId: ConfigurableEntityId,
  fieldId: string,
  colSpan: number,
): FormLayoutConfig {
  const clamped = Math.min(Math.max(1, colSpan), config.cols);
  const def = getFieldDef(entityId, fieldId, config);
  const existing = config.overrides[fieldId];
  const maxSpan = getMaxColSpan(config, entityId, fieldId);
  const finalSpan = Math.min(clamped, maxSpan);
  return {
    ...config,
    overrides: {
      ...config.overrides,
      [fieldId]: {
        type: existing?.type ?? def?.defaultType ?? 'text',
        label: existing?.label ?? def?.label,
        required: existing?.required ?? def?.required,
        colSpan: finalSpan,
      },
    },
  };
}

export function updateFieldOverride(
  config: FormLayoutConfig,
  entityId: ConfigurableEntityId,
  fieldId: string,
  patch: Partial<{ type: FieldType; label: string; required: boolean; colSpan: number }>,
): FormLayoutConfig {
  const def = getFieldDef(entityId, fieldId, config);
  const existing = config.overrides[fieldId];
  const nextOverrides = {
    ...config.overrides,
    [fieldId]: {
      type: existing?.type ?? def?.defaultType ?? 'text',
      label: existing?.label ?? def?.label ?? fieldId,
      required: existing?.required ?? def?.required ?? false,
      colSpan: existing?.colSpan ?? resolveColSpan(entityId, fieldId, config),
      ...patch,
    },
  };

  if (!isCustomFieldId(fieldId)) {
    return { ...config, overrides: nextOverrides };
  }

  return {
    ...config,
    customFields: (config.customFields ?? []).map((f) =>
      f.id === fieldId
        ? {
            ...f,
            label: patch.label ?? f.label,
            type: patch.type ?? f.type,
            required: patch.required ?? f.required,
          }
        : f,
    ),
    overrides: nextOverrides,
  };
}

export function listPlacedFields(entityId: ConfigurableEntityId, config: FormLayoutConfig) {
  const seen = new Set<string>();
  const items: { fieldId: string; cellKey: string; label: string }[] = [];
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const key = cellKey(r, c);
      const fieldId = config.placements[key];
      if (!fieldId || seen.has(fieldId)) continue;
      seen.add(fieldId);
      items.push({
        fieldId,
        cellKey: key,
        label: resolveFieldLabel(entityId, fieldId, config),
      });
    }
  }
  return items;
}
