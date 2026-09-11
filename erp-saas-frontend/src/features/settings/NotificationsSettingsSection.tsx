import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/cn';
import { applyNotificationPrefs } from '@/lib/notification-prefs';
import { fetchNotifications } from '@/services/notifications.service';
import {
  fetchNotificationPrefs,
  updateNotificationPrefs,
} from '@/services/settings.service';
import { useNotificationsStore } from '@/store/notifications.store';
import { usePreferencesStore } from '@/store/preferences.store';
import { useAuthReady } from '@/hooks/useAuthReady';
import type { NotificationPrefs } from '@/lib/notification-prefs';

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}

export function NotificationsSettingsSection() {
  const queryClient = useQueryClient();
  const clearDismissed = useNotificationsStore((s) => s.clearDismissed);
  const [saved, setSaved] = useState(false);
  const authReady = useAuthReady();

  const prefsQuery = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: fetchNotificationPrefs,
    enabled: authReady,
  });

  const countsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: authReady,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (prefsQuery.data) {
      applyNotificationPrefs(prefsQuery.data);
    }
  }, [prefsQuery.data]);

  const mutation = useMutation({
    mutationFn: updateNotificationPrefs,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'notifications'], data);
      applyNotificationPrefs(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updatePref = (patch: Partial<NotificationPrefs>) => {
    const current = prefsQuery.data ?? {
      notifyOrders: usePreferencesStore.getState().notifyOrders,
      notifyInvoices: usePreferencesStore.getState().notifyInvoices,
      notifySystem: usePreferencesStore.getState().notifySystem,
    };
    mutation.mutate({ ...current, ...patch });
  };

  if (prefsQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  if (prefsQuery.isError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudieron cargar las preferencias de avisos.</p>
      </Card>
    );
  }

  const prefs = prefsQuery.data!;
  const counts = countsQuery.data?.counts;

  return (
    <Card className="divide-y divide-border/60">
      <div className="space-y-3 p-6">
        <div>
          <h2 className="text-lg font-semibold">Avisos</h2>
          <p className="text-sm text-muted-foreground">
            Elige qué alertas aparecen en la campanita del panel. Se guardan en tu cuenta y se
            sincronizan entre dispositivos.
          </p>
        </div>
        {countsQuery.isSuccess && counts && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1">
              Inventario: {counts.system}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              Facturas: {counts.invoices}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              Pedidos: {counts.orders}
            </span>
          </div>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-600">No se pudo guardar. Inténtalo de nuevo.</p>
        )}
      </div>

      <ToggleRow
        title="Pedidos"
        description="Pedidos confirmados pendientes de envío"
        checked={prefs.notifyOrders}
        disabled={mutation.isPending}
        onChange={(notifyOrders) => updatePref({ notifyOrders })}
      />
      <ToggleRow
        title="Facturas"
        description="Facturas emitidas con fecha de vencimiento pasada"
        checked={prefs.notifyInvoices}
        disabled={mutation.isPending}
        onChange={(notifyInvoices) => updatePref({ notifyInvoices })}
      />
      <ToggleRow
        title="Inventario"
        description="Productos con stock en o por debajo del mínimo"
        checked={prefs.notifySystem}
        disabled={mutation.isPending}
        onChange={(notifySystem) => updatePref({ notifySystem })}
      />

      <div className="p-4">
        <button
          type="button"
          className="text-sm text-primary hover:underline disabled:opacity-50"
          disabled={mutation.isPending}
          onClick={clearDismissed}
        >
          Restaurar alertas descartadas en este dispositivo
        </button>
      </div>
    </Card>
  );
}
