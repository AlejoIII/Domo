import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney } from '@/lib/format';
import { lineTotal } from '@/lib/document-lines';
import { cn } from '@/lib/cn';
import { fetchProducts } from '@/services/products.service';
import type { DocLine } from '@/types/document.types';

function emptyLine(): DocLine {
  return { description: '', quantity: 1, unitPrice: 0, productId: '' };
}

interface DocumentLinesEditorProps {
  lines: DocLine[];
  onChange: (lines: DocLine[]) => void;
  /** Muestra columna IVA por línea (facturas) */
  enableLineTaxRates?: boolean;
  defaultTaxRate?: number;
}

export function DocumentLinesEditor({
  lines,
  onChange,
  enableLineTaxRates = false,
  defaultTaxRate = 21,
}: DocumentLinesEditorProps) {
  const { data } = useQuery({
    queryKey: ['products', 'picker'],
    queryFn: () => fetchProducts({ page: 1, limit: 100 }),
  });
  const products = data?.items ?? [];

  const updateLine = (index: number, patch: Partial<DocLine>) => {
    onChange(
      lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, ...patch };
        return { ...next, lineTotal: lineTotal(next) };
      }),
    );
  };

  const selectProduct = (index: number, productId: string) => {
    if (!productId) {
      updateLine(index, { productId: undefined });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) {
      updateLine(index, { productId });
      return;
    }
    updateLine(index, {
      productId: product.id,
      description: product.name,
      unitPrice: Number(product.price),
    });
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const addLine = () => {
    onChange([...lines, emptyLine()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Líneas</h3>
        <Button type="button" variant="secondary" onClick={addLine}>
          <Plus className="h-4 w-4" />
          Añadir línea
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          No hay líneas. Añade al menos una.
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id ?? index}
              className={cn(
                'grid gap-3 rounded-lg border border-border/60 p-3',
                enableLineTaxRates
                  ? 'sm:grid-cols-[1.2fr_1fr_5rem_7rem_5rem_6rem_auto]'
                  : 'sm:grid-cols-[1.2fr_1fr_5rem_7rem_6rem_auto]',
              )}
            >
              <div className="space-y-1">
                {index === 0 && <label className="text-sm font-medium">Producto</label>}
                <select
                  className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={line.productId ?? ''}
                  onChange={(e) => selectProduct(index, e.target.value)}
                >
                  <option value="">Manual / sin producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({formatMoney(Number(p.price))})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={index === 0 ? 'Descripción *' : undefined}
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
                placeholder="Servicio de consultoría, 2 h"
              />
              <Input
                label={index === 0 ? 'Cant.' : undefined}
                type="number"
                min={0}
                step="0.01"
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                placeholder="1"
              />
              <Input
                label={index === 0 ? 'P. unitario' : undefined}
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                placeholder="50.00"
              />
              {enableLineTaxRates && (
                <Input
                  label={index === 0 ? 'IVA %' : undefined}
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.taxRate ?? defaultTaxRate}
                  onChange={(e) =>
                    updateLine(index, {
                      taxRate: e.target.value === '' ? defaultTaxRate : Number(e.target.value),
                    })
                  }
                  placeholder={String(defaultTaxRate)}
                />
              )}
              <div className="space-y-1">
                {index === 0 && <span className="text-sm font-medium">Total</span>}
                <p className="flex h-10 items-center text-sm font-medium">
                  {formatMoney(lineTotal(line))}
                </p>
              </div>
              <div className={`flex ${index === 0 ? 'items-end' : 'items-center'} pb-0.5`}>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded p-2 text-red-600 hover:bg-red-500/10"
                  title="Eliminar línea"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
