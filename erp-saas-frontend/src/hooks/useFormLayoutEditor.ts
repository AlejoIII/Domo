import { useContext } from 'react';
import { FormLayoutEditorContext } from '@/contexts/form-layout-editor-context';

export function useFormLayoutEditor() {
  const ctx = useContext(FormLayoutEditorContext);
  if (!ctx) {
    throw new Error('useFormLayoutEditor debe usarse dentro de FormLayoutEditorProvider');
  }
  return ctx;
}

export function useOptionalFormLayoutEditor() {
  return useContext(FormLayoutEditorContext);
}
