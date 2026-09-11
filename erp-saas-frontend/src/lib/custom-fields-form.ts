import { z } from 'zod';
import type { FormLayoutConfig } from '@/types/form-layout.types';
import {
  listAllFieldDefinitions,
  isCustomFieldId,
  type ConfigurableEntityId,
} from '@/config/field-definitions';
import type { FieldType } from '@/types/form-layout.types';
function zodForFieldType(type: FieldType, required: boolean) {
  let base: z.ZodTypeAny;
  switch (type) {
    case 'email':
      base = z.string().email('Email inválido').or(z.literal(''));
      break;
    case 'integer':
      base = z.coerce.number().int('Debe ser un número entero').or(z.literal('')).or(z.nan());
      break;
    case 'decimal':
      base = z.coerce.number().or(z.literal('')).or(z.nan());
      break;
    case 'date':
      base = z.string();
      break;
    default:
      base = z.string();
  }
  if (required) {
    if (type === 'email') {
      return z.string().min(1, 'Campo obligatorio').email('Email inválido');
    }
    return base.refine((v) => v !== '' && v !== undefined && v !== null && !Number.isNaN(v), {
      message: 'Campo obligatorio',
    });
  }
  return base.optional();
}

export function buildCustomFieldsSchema(entityId: ConfigurableEntityId, config: FormLayoutConfig) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of listAllFieldDefinitions(entityId, config)) {
    if (!isCustomFieldId(field.id)) continue;
    const type = config.overrides[field.id]?.type ?? field.defaultType;
    const required = config.overrides[field.id]?.required ?? field.required ?? false;
    shape[field.id] = zodForFieldType(type, required);
  }
  return z.object(shape);
}

export function buildCustomFieldDefaultValues(
  entityId: ConfigurableEntityId,
  config: FormLayoutConfig,
  values?: Record<string, unknown>,
) {
  const defaults: Record<string, unknown> = {};
  for (const field of listAllFieldDefinitions(entityId, config)) {
    if (!isCustomFieldId(field.id)) continue;
    defaults[field.id] = values?.[field.id] ?? '';
  }
  return defaults;
}

export function extractCustomFieldValues(
  data: Record<string, unknown>,
  entityId: ConfigurableEntityId,
  config: FormLayoutConfig,
) {
  const customFields: Record<string, unknown> = {};
  const rest = { ...data };
  for (const field of listAllFieldDefinitions(entityId, config)) {
    if (!isCustomFieldId(field.id)) continue;
    if (field.id in rest) {
      customFields[field.id] = rest[field.id];
      delete rest[field.id];
    }
  }
  return { rest, customFields };
}

export function mergeWithCustomFieldsSchema<T extends z.ZodRawShape>(
  baseShape: T,
  entityId: ConfigurableEntityId,
  config: FormLayoutConfig,
) {
  const customShape = buildCustomFieldsSchema(entityId, config).shape;
  return z.object({ ...baseShape, ...customShape });
}