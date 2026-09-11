import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface ListFilterBarProps {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

export function ListFilterBar({
  children,
  onReset,
  showReset,
  className,
}: ListFilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        {children}
      </div>
      {showReset && onReset && (
        <Button type="button" variant="ghost" className="self-start px-2 text-sm" onClick={onReset}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
