import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Mail, MessageSquare, Plus, Settings2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { formatMoney } from '@/lib/format';
import { fetchClients } from '@/services/clients.service';
import {
  completeCrmActivity,
  convertCrmLead,
  convertOpportunityToQuote,
  createCrmActivity,
  createCrmIncident,
  createCrmLead,
  createCrmOpportunity,
  deleteCrmActivity,
  deleteCrmIncident,
  deleteCrmLead,
  fetchCrmActivities,
  fetchCrmIncidents,
  fetchCrmLeads,
  fetchCrmPipeline,
  moveCrmOpportunityStage,
  updateCrmIncident,
  updateCrmLead,
} from '@/services/crm.service';
import type { CrmActivity, CrmIncident, CrmLead, CrmOpportunity } from '@/types/crm.types';
import { SendCommunicationModal } from '@/components/crm/SendCommunicationModal';
import { fetchCrmCatalog } from '@/services/crm-config.service';
import { catalogLabel, useCrmCatalogs } from '@/hooks/useCrmCatalogs';

const tabs = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'leads', label: 'Leads' },
  { id: 'incidents', label: 'Incidencias' },
  { id: 'activities', label: 'Actividades' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function CrmPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'pipeline',
  );
  const [tabDirty, setTabDirty] = useState(false);
  const { requestLeave, dialog } = useUnsavedChangesGuard(tabDirty);

  const selectTab = (next: TabId) => {
    if (next === tab) return;
    requestLeave(() => {
      setTab(next);
      setSearchParams({ tab: next }, { replace: true });
      setTabDirty(false);
    });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline comercial, leads, oportunidades y actividades
          </p>
        </div>
        <Link to="/crm/settings">
          <Button variant="secondary">
            <Settings2 className="h-4 w-4" />
            Configuración CRM
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && <PipelineTab onDirtyChange={setTabDirty} />}
      {tab === 'leads' && <LeadsTab onDirtyChange={setTabDirty} />}
      {tab === 'incidents' && <IncidentsTab onDirtyChange={setTabDirty} />}
      {tab === 'activities' && <ActivitiesTab onDirtyChange={setTabDirty} />}
    </div>
  );
}

function PipelineTab({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const { isDirty, markClean } = useDraftDirty({ title, clientId, amount }, 'pipeline-new');

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'pipeline'],
    queryFn: fetchCrmPipeline,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'crm-select'],
    queryFn: () => fetchClients({ limit: 100, page: 1 }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      moveCrmOpportunityStage(id, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCrmOpportunity({
        title: title.trim(),
        clientId: clientId || undefined,
        amount: amount ? Number(amount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setTitle('');
      setClientId('');
      setAmount('');
      markClean();
    },
  });

  const quoteMutation = useMutation({
    mutationFn: (id: string) => convertOpportunityToQuote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  const clients = clientsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Oportunidades abiertas</p>
          <p className="text-2xl font-bold">{data.summary.totalOpen}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valor pipeline</p>
          <p className="text-2xl font-bold">{formatMoney(data.summary.totalValue)}</p>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva oportunidad</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Título"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Renovación del mantenimiento anual"
          />
          <SelectField
            label="Cliente"
            optionalHint
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Sin cliente (solo lead)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Importe estimado"
            optionalHint
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button
          loading={createMutation.isPending}
          disabled={!title.trim()}
          onClick={() => createMutation.mutate()}
        >
          <Plus className="h-4 w-4" />
          Crear oportunidad
        </Button>
      </Card>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {data.stages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[280px] flex-shrink-0 rounded-lg border border-border/60 bg-muted/20"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggingId) {
                moveMutation.mutate({ id: draggingId, stageId: stage.id });
                setDraggingId(null);
              }
            }}
          >
            <div
              className="border-b border-border/60 px-3 py-2"
              style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{stage.name}</h3>
                <Badge variant="muted">{stage.opportunities.length}</Badge>
              </div>
            </div>
            <div className="space-y-2 p-2">
              {stage.opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  onDragStart={() => setDraggingId(opp.id)}
                  onConvertQuote={() => quoteMutation.mutate(opp.id)}
                  converting={quoteMutation.isPending}
                />
              ))}
              {stage.opportunities.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">Vacío</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({
  opp,
  onDragStart,
  onConvertQuote,
  converting,
}: {
  opp: CrmOpportunity;
  onDragStart: () => void;
  onConvertQuote: () => void;
  converting: boolean;
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-grab space-y-2 p-3 active:cursor-grabbing"
    >
      <p className="font-medium leading-snug">{opp.title}</p>
      {opp.client && (
        <p className="text-xs text-muted-foreground">{opp.client.name}</p>
      )}
      {opp.amount != null && opp.amount > 0 && (
        <p className="text-sm font-semibold">{formatMoney(opp.amount)}</p>
      )}
      <div className="flex flex-wrap gap-1">
        <Badge variant="muted">{opp.probability}%</Badge>
        {opp.quote && (
          <Link to={`/quotes/${opp.quote.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {opp.quote.number}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      {!opp.quote && opp.clientId && (
        <Button variant="secondary" loading={converting} onClick={onConvertQuote}>
          → Presupuesto
        </Button>
      )}
    </Card>
  );
}

function LeadsTab({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const { statuses, isLoading: catalogsLoading } = useCrmCatalogs();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [source, setSource] = useState('');
  const [statusId, setStatusId] = useState('');
  const [sendModal, setSendModal] = useState<{ mode: 'email' | 'sms'; lead: CrmLead } | null>(null);
  const { isDirty, markClean } = useDraftDirty(
    { name, email, companyName, source, statusId },
    'leads-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const editableStatuses = statuses.filter((s) => s.code !== 'converted');
  const defaultStatusId = editableStatuses[0]?.id ?? '';

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm', 'leads'],
    queryFn: () => fetchCrmLeads(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCrmLead({
        name: name.trim(),
        email: email.trim() || undefined,
        companyName: companyName.trim() || undefined,
        source: source.trim() || undefined,
        statusId: statusId || defaultStatusId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setName('');
      setEmail('');
      setCompanyName('');
      setSource('');
      setStatusId('');
      markClean();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatusId }: { id: string; nextStatusId: string }) =>
      updateCrmLead(id, { statusId: nextStatusId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => convertCrmLead(id, { createOpportunity: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrmLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  if (isLoading || catalogsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SendCommunicationModal
        mode={sendModal?.mode ?? 'email'}
        open={!!sendModal}
        onClose={() => setSendModal(null)}
        defaultTo={sendModal?.mode === 'email' ? (sendModal.lead.email ?? '') : (sendModal?.lead.phone ?? '')}
        leadId={sendModal?.lead.id}
        contactName={sendModal?.lead.name}
      />
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nuevo lead</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Laura Gómez" />
          <Input label="Email" type="email" optionalHint value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
          <Input label="Empresa" optionalHint value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Talleres Martínez S.L." />
          <Input label="Origen" optionalHint value={source} onChange={(e) => setSource(e.target.value)} placeholder="Formulario web" />
          <SelectField
            label="Estado"
            optionalHint
            value={statusId || defaultStatusId}
            onChange={(e) => setStatusId(e.target.value)}
          >
            {editableStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectField>
        </div>
        <Button loading={createMutation.isPending} disabled={!name.trim()} onClick={() => createMutation.mutate()}>
          Crear lead
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Leads</h2>
        </div>
        {leads.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No hay leads.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Contacto</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: CrmLead) => (
                <tr key={lead.id} className="border-b border-border/30">
                  <td className="px-4 py-2">
                    <p className="font-medium">{lead.name}</p>
                    {lead.companyName && (
                      <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {lead.email ?? lead.phone ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    {lead.status === 'converted' ? (
                      <Badge variant="success">
                        {catalogLabel(lead.statusCatalog, lead.status, statuses)}
                      </Badge>
                    ) : (
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                        value={lead.statusId ?? editableStatuses.find((s) => s.code === lead.status)?.id ?? ''}
                        onChange={(e) =>
                          updateStatusMutation.mutate({ id: lead.id, nextStatusId: e.target.value })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        {editableStatuses.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {lead.email && (
                        <Button
                          variant="secondary"
                          title="Enviar email"
                          onClick={() => setSendModal({ mode: 'email', lead })}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {lead.phone && (
                        <Button
                          variant="secondary"
                          title="Enviar SMS"
                          onClick={() => setSendModal({ mode: 'sms', lead })}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {lead.status !== 'converted' && (
                        <Button
                          variant="secondary"
                          loading={convertMutation.isPending}
                          onClick={() => convertMutation.mutate(lead.id)}
                        >
                          Convertir
                        </Button>
                      )}
                      {lead.clientId && (
                        <Link to={`/clients/${lead.clientId}`} className="text-xs text-primary hover:underline">
                          Cliente
                        </Link>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (confirm('¿Eliminar lead?')) deleteMutation.mutate(lead.id);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function IncidentsTab({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [typeId, setTypeId] = useState('');
  const [leadId, setLeadId] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { title, description, priority, typeId, leadId },
    'incidents-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['crm', 'incidents'],
    queryFn: () => fetchCrmIncidents(),
  });

  const { data: incidentTypes = [] } = useQuery({
    queryKey: ['crm-catalog', 'incident_type'],
    queryFn: () => fetchCrmCatalog('incident_type'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['crm', 'leads', 'incidents-select'],
    queryFn: () => fetchCrmLeads(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCrmIncident({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        typeId: typeId || undefined,
        leadId: leadId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTypeId('');
      setLeadId('');
      markClean();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateCrmIncident(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrmIncident,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const priorityLabel: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };

  const statusLabel: Record<string, string> = {
    open: 'Abierta',
    in_progress: 'En curso',
    resolved: 'Resuelta',
    closed: 'Cerrada',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva incidencia</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Retraso en la entrega del pedido" />
          <SelectField label="Prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </SelectField>
          <SelectField label="Tipo" optionalHint value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Sin tipo</option>
            {incidentTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </SelectField>
          <SelectField label="Lead relacionado" optionalHint value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">Ninguno</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>{lead.name}</option>
            ))}
          </SelectField>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Descripción</span>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla qué ha ocurrido y qué espera el cliente…"
            />
          </label>
        </div>
        <Button loading={createMutation.isPending} disabled={!title.trim()} onClick={() => createMutation.mutate()}>
          Crear incidencia
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Incidencias</h2>
        </div>
        {incidents.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No hay incidencias registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Incidencia</th>
                <th className="px-4 py-2 font-medium">Prioridad</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident: CrmIncident) => (
                <tr key={incident.id} className="border-b border-border/30">
                  <td className="px-4 py-2">
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.typeCatalog?.name ?? 'Sin tipo'}
                      {incident.lead ? ` · ${incident.lead.name}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={incident.priority === 'urgent' ? 'danger' : 'muted'}>
                      {priorityLabel[incident.priority] ?? incident.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      value={incident.status}
                      onChange={(e) =>
                        updateMutation.mutate({ id: incident.id, status: e.target.value })
                      }
                      disabled={updateMutation.isPending}
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (confirm('¿Eliminar incidencia?')) deleteMutation.mutate(incident.id);
                      }}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ActivitiesTab({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const {
    taskTypes,
    subjects,
    taskSituations,
    agendaClassifications,
    isLoading: catalogsLoading,
  } = useCrmCatalogs();
  const [taskTypeId, setTaskTypeId] = useState('');
  const [subjectCatalogId, setSubjectCatalogId] = useState('');
  const [subject, setSubject] = useState('');
  const [situationId, setSituationId] = useState('');
  const [agendaClassificationId, setAgendaClassificationId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [clientId, setClientId] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { taskTypeId, subjectCatalogId, subject, situationId, agendaClassificationId, dueAt, clientId },
    'activities-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const defaultTaskTypeId = taskTypes[0]?.id ?? '';
  const defaultSituationId =
    taskSituations.find((s) => s.code === 'pending')?.id ?? taskSituations[0]?.id ?? '';

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm', 'activities'],
    queryFn: () => fetchCrmActivities({ pending: true }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'crm-activity'],
    queryFn: () => fetchClients({ limit: 100, page: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCrmActivity({
        taskTypeId: taskTypeId || defaultTaskTypeId || undefined,
        subjectCatalogId: subjectCatalogId || undefined,
        subject: subject.trim() || undefined,
        situationId: situationId || defaultSituationId || undefined,
        agendaClassificationId: agendaClassificationId || undefined,
        dueAt: dueAt || undefined,
        clientId: clientId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setSubject('');
      setSubjectCatalogId('');
      setDueAt('');
      setClientId('');
      setAgendaClassificationId('');
      setSituationId('');
      setTaskTypeId('');
      markClean();
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeCrmActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrmActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  if (isLoading || catalogsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  const clients = clientsData?.items ?? [];
  const canCreate = Boolean(subject.trim() || subjectCatalogId);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva actividad</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo de tarea</label>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={taskTypeId || defaultTaskTypeId}
              onChange={(e) => setTaskTypeId(e.target.value)}
            >
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Asunto (catálogo)</label>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={subjectCatalogId}
              onChange={(e) => {
                const id = e.target.value;
                setSubjectCatalogId(id);
                const preset = subjects.find((s) => s.id === id);
                if (preset) setSubject(preset.name);
              }}
            >
              <option value="">Personalizado…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Input label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Llamada de seguimiento del presupuesto" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Situación</label>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={situationId || defaultSituationId}
              onChange={(e) => setSituationId(e.target.value)}
            >
              {taskSituations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Clasificación agenda</label>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={agendaClassificationId}
              onChange={(e) => setAgendaClassificationId(e.target.value)}
            >
              <option value="">—</option>
              {agendaClassifications.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Input label="Fecha límite" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Cliente (opcional)</label>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button loading={createMutation.isPending} disabled={!canCreate} onClick={() => createMutation.mutate()}>
          Crear actividad
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Actividades pendientes</h2>
        </div>
        {activities.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No hay actividades pendientes.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {activities.map((a: CrmActivity) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">
                      {catalogLabel(a.taskTypeCatalog, a.type, taskTypes)}
                    </Badge>
                    {a.situationCatalog && (
                      <Badge variant="muted">{a.situationCatalog.name}</Badge>
                    )}
                    {a.agendaClassification && (
                      <Badge variant="muted">{a.agendaClassification.name}</Badge>
                    )}
                    <p className="font-medium">{a.subject}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[a.client?.name, a.lead?.name, a.opportunity?.title].filter(Boolean).join(' · ') ||
                      'Sin vínculo'}
                    {a.dueAt && ` · ${a.dueAt.slice(0, 16).replace('T', ' ')}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" loading={completeMutation.isPending} onClick={() => completeMutation.mutate(a.id)}>
                    Completar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (confirm('¿Eliminar actividad?')) deleteMutation.mutate(a.id);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
