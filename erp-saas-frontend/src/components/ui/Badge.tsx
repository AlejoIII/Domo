import { cn } from '@/lib/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'muted' | 'danger';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-success/15 text-success',
        variant === 'muted' && 'bg-muted text-muted-foreground',
        variant === 'danger' && 'bg-red-500/15 text-red-600',
        variant === 'default' && 'bg-primary/10 text-primary',
      )}
    >
      {children}
    </span>
  );
}
