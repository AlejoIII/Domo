import { cn } from '@/lib/cn';

export function Loader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      size === 'sm' ? 'h-3 w-3' : 'h-5 w-5',
    )} />
  );
}
