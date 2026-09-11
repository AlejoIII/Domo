import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ConfigurableEntityId } from '@/config/field-definitions';
import { useFormLayoutEditor } from '@/hooks/useFormLayoutEditor';
import {
  buildCustomFieldDefaultValues,
  extractCustomFieldValues,
  mergeWithCustomFieldsSchema,
} from '@/lib/custom-fields-form';

export function useConfigurableForm<T extends z.ZodRawShape>({
  entityId,
  baseSchema,
  defaultValues,
  customFieldValues,
}: {
  entityId: ConfigurableEntityId;
  baseSchema: z.ZodObject<T>;
  defaultValues: z.infer<z.ZodObject<T>>;
  customFieldValues?: Record<string, unknown>;
}) {
  const { activeConfig, isLoading, editMode } = useFormLayoutEditor();

  const schema = useMemo(
    () => mergeWithCustomFieldsSchema(baseSchema.shape, entityId, activeConfig),
    [baseSchema, entityId, activeConfig],
  );

  const mergedDefaults = useMemo(
    () => ({
      ...defaultValues,
      ...buildCustomFieldDefaultValues(entityId, activeConfig, customFieldValues),
    }),
    [defaultValues, entityId, activeConfig, customFieldValues],
  );

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: mergedDefaults,
    mode: 'onChange',
  });

  useEffect(() => {
    if (customFieldValues === undefined) return;
    const cfDefaults = buildCustomFieldDefaultValues(entityId, activeConfig, customFieldValues);
    for (const [key, value] of Object.entries(cfDefaults)) {
      form.setValue(key, value);
    }
  }, [customFieldValues, entityId, activeConfig, form]);

  const splitSubmitData = (data: Record<string, unknown>) =>
    extractCustomFieldValues(data, entityId, activeConfig);

  return {
    ...form,
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  };
}
