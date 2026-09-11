import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { fetchClientSummary } from '@/services/clients.service';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS_LABELS, statusLabel } from '@/lib/documentStatus';

export function ClientSummarySection({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['client', clientId, 'summary'],
    queryFn: () => fetchClientSummary(clientId),
  });

  if (isLoading) {
    return (
      <Card className="flex justify-center p-8">
        <Loader />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudo cargar el resumen del cliente.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Total facturado" value={formatMoney(data.totalBilled)} />
      <Kpi label="Pendiente cobro" value={formatMoney(data.outstanding)} highlight={data.outstanding > 0} />
      <Kpi label="Pedidos" value={String(data.ordersCount)} hint={`${data.quotesCount} presupuestos`} />
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Último pedido</p>
        {data.lastOrder ? (
          <>
            <Link
              to={`/orders/${data.lastOrder.id}`}
              className="mt-1 block font-semibold text-primary hover:underline"
            >
              {data.lastOrder.number}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.lastOrder.orderDate.slice(0, 10)} · {formatMoney(data.lastOrder.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {statusLabel(ORDER_STATUS_LABELS, data.lastOrder.status)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Sin pedidos</p>
        )}
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
