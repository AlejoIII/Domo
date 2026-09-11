import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Key, Plus, Trash2, Webhook, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import {
  createApiKey,
  createWebhook,
  deleteWebhook,
  fetchApiKeys,
  fetchIntegrationsMeta,
  fetchWebhookDeliveries,
  fetchWebhooks,
  revokeApiKey,
  testWebhook,
} from '@/services/integrations.service';
import { cn } from '@/lib/cn';

export function IntegrationsSettingsSection({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [keyName, setKeyName] = useState('');
  const [newPlainKey, setNewPlainKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['invoice.paid']);
  const [copied, setCopied] = useState(false);
  const { isDirty, markClean } = useDraftDirty({ keyName, webhookUrl, selectedEvents }, 'integrations');

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const metaQuery = useQuery({ queryKey: ['integrations', 'meta'], queryFn: fetchIntegrationsMeta });
  const keysQuery = useQuery({ queryKey: ['integrations', 'api-keys'], queryFn: fetchApiKeys });
  const webhooksQuery = useQuery({ queryKey: ['integrations', 'webhooks'], queryFn: fetchWebhooks });
  const deliveriesQuery = useQuery({
    queryKey: ['integrations', 'deliveries'],
    queryFn: fetchWebhookDeliveries,
  });

  const createKeyMutation = useMutation({
    mutationFn: () => createApiKey({ name: keyName.trim() }),
    onSuccess: (data) => {
      setNewPlainKey(data.plainKey);
      setKeyName('');
      markClean();
      queryClient.invalidateQueries({ queryKey: ['integrations', 'api-keys'] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', 'api-keys'] }),
  });

  const createWebhookMutation = useMutation({
    mutationFn: () => createWebhook({ url: webhookUrl.trim(), events: selectedEvents }),
    onSuccess: () => {
      setWebhookUrl('');
      markClean();
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks'] });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'deliveries'] });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', 'deliveries'] }),
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const copyKey = async () => {
    if (!newPlainKey) return;
    await navigator.clipboard.writeText(newPlainKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (metaQuery.isLoading || keysQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  const events = metaQuery.data?.events ?? [];

  return (
    <div className="space-y-6">
      <FormRequiredLegend />
      <Card className="border-border/60 p-6">
        <div className="mb-4 flex items-start gap-3">
          <Key className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">API keys</h3>
            <p className="text-sm text-muted-foreground">
              Acceso de lectura a la API pública ({metaQuery.data?.publicApiBase}). Documentación en{' '}
              <a
                href="http://localhost:3000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                OpenAPI
              </a>
              .
            </p>
          </div>
        </div>

        {newPlainKey && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Copia la clave ahora — no se volverá a mostrar
            </p>
            <code className="mt-2 block break-all text-xs">{newPlainKey}</code>
            <Button className="mt-3 px-3 py-1.5 text-xs" variant="secondary" onClick={copyKey}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? 'Copiada' : 'Copiar'}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            label="Nombre de la clave"
            required
            placeholder="Ej. Zapier, Tienda online"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <Button
            className="sm:mt-6"
            loading={createKeyMutation.isPending}
            disabled={!keyName.trim()}
            onClick={() => createKeyMutation.mutate()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Crear clave
          </Button>
        </div>

        <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border/60">
          {(keysQuery.data ?? []).length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No hay claves activas</li>
          ) : (
            keysQuery.data?.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {key.keyPrefix}… · {key.scopes.join(', ')}
                  </p>
                </div>
                <Button
                  className="px-3 py-1.5 text-xs"
                  variant="danger"
                  loading={revokeKeyMutation.isPending}
                  onClick={() => revokeKeyMutation.mutate(key.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card className="border-border/60 p-6">
        <div className="mb-4 flex items-start gap-3">
          <Webhook className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Webhooks salientes</h3>
            <p className="text-sm text-muted-foreground">
              Domo enviará POST firmados (header X-Domo-Signature) cuando ocurran eventos.
            </p>
          </div>
        </div>

        <Input
          label="URL del webhook"
          required
          placeholder="https://tu-servidor.com/webhooks/domo"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />

        <p className="mt-4 text-sm font-medium">Eventos</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {events.map((event) => (
            <button
              key={event}
              type="button"
              onClick={() => toggleEvent(event)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                selectedEvents.includes(event)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {event}
            </button>
          ))}
        </div>

        <Button
          className="mt-4"
          loading={createWebhookMutation.isPending}
          disabled={!webhookUrl.trim() || selectedEvents.length === 0}
          onClick={() => createWebhookMutation.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" />
          Añadir webhook
        </Button>

        <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border/60">
          {(webhooksQuery.data ?? []).length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No hay webhooks configurados</li>
          ) : (
            webhooksQuery.data?.map((wh) => (
              <li key={wh.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="break-all font-medium">{wh.url}</p>
                  <p className="text-xs text-muted-foreground">{wh.events.join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="px-3 py-1.5 text-xs"
                    variant="secondary"
                    loading={testWebhookMutation.isPending}
                    onClick={() => testWebhookMutation.mutate(wh.id)}
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Probar
                  </Button>
                  <Button
                    className="px-3 py-1.5 text-xs"
                    variant="danger"
                    loading={deleteWebhookMutation.isPending}
                    onClick={() => deleteWebhookMutation.mutate(wh.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      {(deliveriesQuery.data ?? []).length > 0 && (
        <Card className="border-border/60 p-6">
          <h3 className="mb-3 font-semibold">Entregas recientes</h3>
          <ul className="space-y-2 text-sm">
            {deliveriesQuery.data?.slice(0, 10).map((d) => (
              <li key={d.id} className="flex justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <span>
                  {d.event} → {d.endpoint.url.slice(0, 40)}…
                </span>
                <span className={cn(d.status === 'success' ? 'text-green-600' : 'text-red-600')}>
                  {d.status} {d.responseStatus ? `(${d.responseStatus})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
