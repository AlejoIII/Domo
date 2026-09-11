import { formatMoney } from '@/lib/format';

export interface ChartPoint {
  month: string;
  label: string;
  sales: number;
  collections: number;
}

interface SalesChartProps {
  data: ChartPoint[];
}

export function SalesChart({ data }: SalesChartProps) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">Sin datos de ventas todavía.</p>;
  }

  const max = Math.max(...data.flatMap((d) => [d.sales, d.collections]), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Ventas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Cobros
        </span>
      </div>
      <div className="flex h-40 items-end gap-2">
        {data.map((point) => (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-2 rounded-t bg-primary/90 sm:w-3"
                style={{ height: `${(point.sales / max) * 100}%`, minHeight: point.sales > 0 ? 4 : 0 }}
                title={`Ventas: ${formatMoney(point.sales)}`}
              />
              <div
                className="w-2 rounded-t bg-emerald-500/90 sm:w-3"
                style={{ height: `${(point.collections / max) * 100}%`, minHeight: point.collections > 0 ? 4 : 0 }}
                title={`Cobros: ${formatMoney(point.collections)}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground sm:text-xs">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
