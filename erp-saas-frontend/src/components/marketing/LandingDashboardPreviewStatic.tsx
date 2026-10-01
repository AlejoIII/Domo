import {
  BarChart3,
  Box,
  FileText,
  Home,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const navItems = [
  { label: 'Inicio', icon: Home, active: true },
  { label: 'Ventas', icon: ShoppingCart },
  { label: 'Productos', icon: Package },
  { label: 'Stock', icon: Warehouse },
  { label: 'Facturación', icon: FileText },
  { label: 'Clientes', icon: Users },
  { label: 'Proveedores', icon: Truck },
  { label: 'Reportes', icon: BarChart3 },
];

const kpis = [
  { label: 'Ventas del mes', value: '$12.450.000' },
  { label: 'Productos', value: '248' },
  { label: 'Facturas pendientes', value: '12' },
  { label: 'Stock total', value: '1.840 uds' },
];

const activity = [
  { type: 'Factura #1042', detail: 'Cliente: Distribuidora Norte', meta: 'Hace 2 h · $890.000' },
  { type: 'Pedido #892', detail: 'Estado: En preparación', meta: 'Hace 4 h · $1.240.000' },
  { type: 'Movimiento stock', detail: 'Entrada almacén central', meta: 'Hace 6 h · +120 uds' },
];

/** Mock estático si no hay captura en /public/marketing. */
export function LandingDashboardPreviewStatic() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <div className="flex min-h-[340px] bg-card sm:min-h-[380px]">
        <aside className="hidden w-[140px] shrink-0 border-r border-border/60 bg-muted/30 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 px-1">
            <Box className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Domo</span>
          </div>
          <ul className="space-y-0.5">
            {navItems.map(({ label, icon: Icon, active }) => (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]',
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <p className="text-sm font-semibold">Resumen general</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <p className="mt-0.5 text-xs font-bold sm:text-sm">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 lg:col-span-3">
              <p className="text-xs font-medium">Ventas vs facturación</p>
              <div className="mt-3 flex h-24 items-end gap-1.5">
                {[42, 55, 48, 62, 58, 70].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 lg:col-span-2">
              <p className="text-xs font-medium">Actividad reciente</p>
              <ul className="mt-2 space-y-2">
                {activity.map((row) => (
                  <li key={row.type} className="border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <p className="text-[11px] font-medium">{row.type}</p>
                    <p className="text-[10px] text-muted-foreground">{row.detail}</p>
                    <p className="text-[10px] text-muted-foreground">{row.meta}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
