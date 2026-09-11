import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { fetchClientTimeline } from '@/services/clients.service';
import { formatMoney } from '@/lib/format';

const TYPE_LABELS: Record<string, string> = {
  order: 'Pedido',
  invoice: 'Factura',
  payment: 'Pago',
  note: 'Nota',
};

function timelineLink(type: string, id: string) {
  if (type === 'order') return `/orders/${id}`;
  if (type === 'invoice') return `/invoices/${id}`;
  return null;
}

export function ClientTimelineSection({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['client', clientId, 'timeline'],
    queryFn: () => fetchClientTimeline(clientId),
  });

  const items = data?.items ?? [];

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Timeline</h2>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader /></div>
      ) : isError ? (
        <p className="text-sm text-red-600">No se pudo cargar el timeline.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const href = timelineLink(item.type, item.id);
            const content = (
              <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </p>
                  <p className="font-medium">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleString('es-ES')}
                  </p>
                  {item.amount != null && (
                    <p className="font-medium tabular-nums">{formatMoney(item.amount)}</p>
                  )}
                </div>
              </div>
            );

            return (
              <li key={`${item.type}-${item.id}-${item.date}`}>
                {href ? (
                  <Link to={href} className="block transition hover:opacity-90">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
