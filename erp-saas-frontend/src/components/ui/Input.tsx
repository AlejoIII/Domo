import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { FormLabel } from '@/components/forms/FormLabel';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  optionalHint?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, required = false, optionalHint = false, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <FormLabel htmlFor={id} required={required} optionalHint={optionalHint}>
          {label}
        </FormLabel>
      )}
      <input
        ref={ref}
        id={id}
        aria-required={required || undefined}
        className={cn(
          'w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none transition-colors duration-300 ease-in-out focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
