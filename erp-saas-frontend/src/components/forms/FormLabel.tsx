import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
  optionalHint?: boolean;
}

export function FormLabel({
  children,
  required = false,
  optionalHint = false,
  className,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn('text-sm font-medium', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
      )}
      {optionalHint && !required && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
      )}
    </label>
  );
}

export function FormRequiredLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
    </p>
  );
}
