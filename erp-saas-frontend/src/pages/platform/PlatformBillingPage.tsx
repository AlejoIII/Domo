import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { fetchPlatformBilling } from '@/services/platform.service';

export function PlatformBillingPage() {
  const billingQuery = useQuery({ queryKey: ['platform', 'billing'], queryFn: fetchPlatformBilling });

  if (billingQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  const b = billingQuery.data;
  if (!b) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total empresas</p>
          <p className="text-2xl font-bold">{b.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Con Stripe</p>
          <p className="text-2xl font-bold">{b.withStripeSubscription}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-xs text-muted-foreground">Por estado suscripción</p>
          <ul className="text-sm">
            {Object.entries(b.byStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Empresa</th>
              <th className="pb-2">Plan</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Stripe</th>
            </tr>
          </thead>
          <tbody>
            {b.items.map((row) => (
              <tr key={row.id} className="border-b border-border/40">
                <td className="py-2">
                  <Link to={`/platform/companies/${row.id}`} className="text-primary hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="py-2">{row.planName}</td>
                <td className="py-2">{row.subscriptionStatus}</td>
                <td className="py-2">{row.hasStripe ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
