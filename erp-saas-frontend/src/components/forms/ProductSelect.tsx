import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/services/products.service';

interface ProductSelectProps {
  value: string;
  onChange: (productId: string) => void;
  disabled?: boolean;
  label?: string;
}

export function ProductSelect({
  value,
  onChange,
  disabled,
  label = 'Producto',
}: ProductSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'picker'],
    queryFn: () => fetchProducts({ page: 1, limit: 100 }),
  });

  const products = data?.items ?? [];

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm disabled:opacity-50"
        value={value}
        disabled={disabled || isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{isLoading ? 'Cargando…' : 'Seleccionar producto'}</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} · {p.name} (stock: {p.stock})
          </option>
        ))}
      </select>
    </div>
  );
}
