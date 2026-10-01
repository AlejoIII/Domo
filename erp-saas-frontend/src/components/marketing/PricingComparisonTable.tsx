import { Check, Minus } from 'lucide-react';
import { pricingComparisonRows } from '@/lib/marketing-content';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" aria-label="Incluido" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="No incluido" />;
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-3 font-semibold">Comparativa</th>
              <th className="px-4 py-3 text-center font-semibold">Free</th>
              <th className="px-4 py-3 text-center font-semibold text-primary">Premium</th>
              <th className="px-4 py-3 text-center font-semibold">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {pricingComparisonRows.map((row, i) => (
              <tr
                key={row.label}
                className={cn('border-b border-border/40 last:border-0', i % 2 === 1 && 'bg-muted/10')}
              >
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="px-4 py-3 text-center bg-primary/5">
                  <CellValue value={row.premium} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CellValue value={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
