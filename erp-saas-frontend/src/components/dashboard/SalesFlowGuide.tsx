import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Package, Receipt, Truck } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const steps = [
  {
    icon: FileText,
    title: 'Presupuesto',
    description: 'Crea y envía al cliente',
    to: '/quotes/new',
  },
  {
    icon: Truck,
    title: 'Pedido',
    description: 'Convierte el presupuesto aceptado',
    to: '/orders',
  },
  {
    icon: Package,
    title: 'Albarán',
    description: 'Marca entregado e imprime',
    to: '/orders?status=confirmed',
  },
  {
    icon: Receipt,
    title: 'Factura',
    description: 'Convierte el pedido a factura',
    to: '/invoices',
  },
] as const;

export function SalesFlowGuide() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Flujo de venta</h2>
          <p className="text-sm text-muted-foreground">
            Presupuesto → pedido → albarán → factura
          </p>
        </div>
        <Link to="/clients" className="text-xs font-medium text-primary hover:underline">
          CRM clientes
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Link
              to={step.to}
              className="group flex h-full flex-col rounded-lg border border-border/60 p-3 transition hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <step.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Ir
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
