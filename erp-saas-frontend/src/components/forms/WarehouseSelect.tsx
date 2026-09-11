import { useQuery } from '@tanstack/react-query';
import { fetchWarehouses } from '@/services/warehouses.service';

interface WarehouseSelectProps {
  value: string;
  onChange: (warehouseId: string) => void;
  disabled?: boolean;
  label?: string;
  excludeId?: string;
}

export function WarehouseSelect({
  value,
  onChange,
  disabled,
  label = 'Almacén',
  excludeId,
}: WarehouseSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', 'picker'],
    queryFn: () => fetchWarehouses({ page: 1, limit: 100 }),
  });

  const warehouses = (data?.items ?? []).filter((w) => w.id !== excludeId);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm disabled:opacity-50"
        value={value}
        disabled={disabled || isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{isLoading ? 'Cargando…' : 'Seleccionar almacén'}</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} · {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
