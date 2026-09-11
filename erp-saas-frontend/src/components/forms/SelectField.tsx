import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { FormLabel } from '@/components/forms/FormLabel';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  optionalHint?: boolean;
  error?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  required = false,
  optionalHint = false,
  error,
  id,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <FormLabel htmlFor={fieldId} required={required} optionalHint={optionalHint}>
        {label}
      </FormLabel>
      <select
        id={fieldId}
        aria-required={required || undefined}
        className={cn(
          'w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none transition-colors duration-300 ease-in-out focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
