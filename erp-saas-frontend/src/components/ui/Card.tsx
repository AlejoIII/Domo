import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('theme-surface rounded-xl border border-border/60 bg-card shadow-card transition-colors duration-300 ease-in-out', className)} {...props} />;
}
