import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCheck, Package, FileText, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fetchNotifications, type AppAlert } from '@/services/notifications.service';
import { useNotificationsStore } from '@/store/notifications.store';
import { usePreferencesStore } from '@/store/preferences.store';
import { useAuthReady } from '@/hooks/useAuthReady';

const severityStyles: Record<AppAlert['severity'], string> = {
  danger: 'text-red-600 bg-red-500/10',
  warning: 'text-amber-700 bg-amber-500/10 dark:text-amber-300',
  info: 'text-primary bg-primary/10',
};

const typeIcons = {
  low_stock: Package,
  invoice_overdue: FileText,
  order_pending_ship: ClipboardList,
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dismissedIds = useNotificationsStore((s) => s.dismissedIds);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const dismissAll = useNotificationsStore((s) => s.dismissAll);
  const markSeen = useNotificationsStore((s) => s.markSeen);

  const notifySystem = usePreferencesStore((s) => s.notifySystem);
  const notifyInvoices = usePreferencesStore((s) => s.notifyInvoices);
  const notifyOrders = usePreferencesStore((s) => s.notifyOrders);
  const authReady = useAuthReady();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: authReady,
    refetchInterval: authReady ? 60_000 : false,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) return false;
      return count < 2;
    },
  });

  const visibleAlerts = useMemo(() => {
    const alerts = data?.alerts ?? [];
    return alerts.filter((alert) => {
      if (dismissedIds.includes(alert.id)) return false;
      if (alert.category === 'system' && !notifySystem) return false;
      if (alert.category === 'invoices' && !notifyInvoices) return false;
      if (alert.category === 'orders' && !notifyOrders) return false;
      return true;
    });
  }, [data?.alerts, dismissedIds, notifySystem, notifyInvoices, notifyOrders]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unreadCount = visibleAlerts.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded p-2 hover:bg-muted"
        title="Alertas"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markSeen();
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Alertas</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount === 0 ? 'Todo al día' : `${unreadCount} pendiente(s)`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => dismissAll(visibleAlerts.map((a) => a.id))}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Cargando alertas…</p>
            ) : isError ? (
              <div className="space-y-2 p-4">
                <p className="text-sm text-red-600">No se pudieron cargar las alertas.</p>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => refetch()}>
                  Reintentar
                </button>
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay alertas activas</p>
                <Link to="/settings?tab=notifications" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                  Configurar avisos
                </Link>
              </div>
            ) : (
              <ul>
                {visibleAlerts.map((alert) => {
                  const Icon = typeIcons[alert.type];
                  return (
                    <li key={alert.id} className="border-b border-border/40 last:border-0">
                      <div className="flex gap-3 p-3">
                        <div className={cn('mt-0.5 rounded-lg p-2', severityStyles[alert.severity])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                          <div className="mt-2 flex gap-3">
                            <Link
                              to={alert.link}
                              className="text-xs font-medium text-primary hover:underline"
                              onClick={() => {
                                dismiss(alert.id);
                                setOpen(false);
                              }}
                            >
                              Ver
                            </Link>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => dismiss(alert.id)}
                            >
                              Descartar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {visibleAlerts.length > 0 && (
            <div className="border-t border-border/60 px-4 py-2 text-center">
              <Link
                to="/products?lowStock=1"
                className="text-xs text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Ver productos con stock bajo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
