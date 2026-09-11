import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Loader } from './Loader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-muted',
        variant === 'ghost' && 'hover:bg-muted',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
      {...props}
    >
      {loading && <Loader size="sm" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
