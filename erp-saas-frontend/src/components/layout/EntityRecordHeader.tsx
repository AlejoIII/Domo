import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface EntityRecordHeaderProps {
  backLabel: string;
  onBack: () => void;
  actions?: ReactNode;
}

export function EntityRecordHeader({ backLabel, onBack, actions }: EntityRecordHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
