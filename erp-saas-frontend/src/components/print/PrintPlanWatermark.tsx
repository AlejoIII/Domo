import { FREE_PDF_WATERMARK } from '@/config/plan-features.config';
import { cn } from '@/lib/cn';

interface PrintPlanWatermarkProps {
  enabled: boolean;
  text?: string | null;
  className?: string;
}

/** Marca de agua diagonal en documentos imprimibles (plan Free) */
export function PrintPlanWatermark({ enabled, text, className }: PrintPlanWatermarkProps) {
  if (!enabled) return null;

  const label = text?.trim() || FREE_PDF_WATERMARK;

  return (
    <div
      className={cn('domo-print-watermark pointer-events-none absolute inset-0 z-10 overflow-hidden', className)}
      aria-hidden
    >
      <span className="domo-print-watermark-text select-none whitespace-nowrap font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
