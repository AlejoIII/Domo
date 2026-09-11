import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useTabbedPageGuard } from '@/hooks/useTabbedPageGuard';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { formatMoney } from '@/lib/format';
import { fetchClients } from '@/services/clients.service';
import { fetchEmployees } from '@/services/employees.service';
import {
  createProject,
  createTimeEntry,
  deleteProject,
  deleteTimeEntry,
  fetchProjectSummary,
  fetchProjects,
  fetchTimeEntries,
  generateProjectInvoice,
} from '@/services/projects.service';
import type { Project } from '@/types/project.types';

const tabs = [
  { id: 'projects', label: 'Proyectos' },
  { id: 'time', label: 'Partes de horas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  on_hold: 'En pausa',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'projects',
  );
  const { setTabDirty, switchTab, dialog } = useTabbedPageGuard();

  const selectTab = (next: TabId) => {
    switchTab(next, tab, (t) => {
      setTab(t);
      setSearchParams({ tab: t }, { replace: true });
    });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <p className="text-sm text-muted-foreground">
          Proyectos por cliente, partes de horas y facturación por tarifa
        </p>
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

      {tab === 'projects' && <ProjectsTab onDirtyChange={setTabDirty} />}
      {tab === 'time' && <TimeEntriesTab onDirtyChange={setTabDirty} />}
    </div>
  );
}

function ProjectsTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [code, setCode] = useState('');
  const [hourlyRate, setHourlyRate] = useState('65');
  const [budgetHours, setBudgetHours] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { name, clientId, code, hourlyRate, budgetHours },
    'projects-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'projects-select'],
    queryFn: () => fetchClients({ limit: 100, page: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createProject({
        clientId,
        name: name.trim(),
        code: code.trim() || undefined,
        hourlyRate: Number(hourlyRate) || 0,
        budgetHours: budgetHours ? Number(budgetHours) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setClientId('');
      setCode('');
      setBudgetHours('');
      markClean();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const invoiceMutation = useMutation({
    mutationFn: (id: string) => generateProjectInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  const clients = clientsData?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nuevo proyecto</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Nombre"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Implantación ERP Vera"
          />
          <SelectField
            label="Cliente"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Código"
            optionalHint
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PRJ-2026-01"
          />
          <Input
            label="Tarifa €/h"
            optionalHint
            type="number"
            min={0}
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="45.00"
          />
          <Input
            label="Presupuesto horas"
            optionalHint
            type="number"
            min={0}
            step="0.5"
            value={budgetHours}
            onChange={(e) => setBudgetHours(e.target.value)}
            placeholder="80"
          />
        </div>
        <Button
          loading={createMutation.isPending}
          disabled={!name.trim() || !clientId}
          onClick={() => createMutation.mutate()}
        >
          <Plus className="h-4 w-4" />
          Crear proyecto
        </Button>
      </Card>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No hay proyectos.</p>
          </Card>
        ) : (
          projects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              expanded={expandedId === project.id}
              onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
              onDelete={() => {
                if (confirm(`¿Eliminar proyecto "${project.name}"?`)) {
                  deleteMutation.mutate(project.id);
                }
              }}
              onInvoice={() => invoiceMutation.mutate(project.id)}
              invoicing={invoiceMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  expanded,
  onToggle,
  onDelete,
  onInvoice,
  invoicing,
}: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onInvoice: () => void;
  invoicing: boolean;
}) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['projects', project.id, 'summary'],
    queryFn: () => fetchProjectSummary(project.id),
    enabled: expanded,
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <button type="button" className="text-left" onClick={onToggle}>
          <p className="font-semibold">{project.name}</p>
          <p className="text-sm text-muted-foreground">
            {project.client?.name}
            {project.code && ` · ${project.code}`}
          </p>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{STATUS_LABELS[project.status] ?? project.status}</Badge>
          <span className="text-sm font-medium">{formatMoney(project.hourlyRate)}/h</span>
        </div>
      </div>

      <div className="grid gap-3 border-t border-border/60 px-4 py-3 sm:grid-cols-4">
        <Stat label="Horas totales" value={`${project.totalHours} h`} />
        <Stat label="Sin facturar" value={`${project.unbilledHours} h`} />
        <Stat label="Importe pendiente" value={formatMoney(project.unbilledAmount)} />
        <Stat
          label="Presupuesto"
          value={project.budgetHours ? `${project.budgetHours} h` : '—'}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3">
        <Button variant="secondary" onClick={onToggle}>
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
        </Button>
        {project.unbilledHours > 0 && project.hourlyRate > 0 && (
          <Button loading={invoicing} onClick={onInvoice}>
            <FileText className="h-4 w-4" />
            Facturar horas
          </Button>
        )}
        <Button variant="secondary" onClick={onDelete}>
          Eliminar
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border/60 bg-muted/20 p-4">
          {isLoading || !summary ? (
            <Loader />
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Horas facturables" value={`${summary.totals.billableHours} h`} />
                <Stat label="Cobrado (est.)" value={formatMoney(summary.totals.billedAmount)} />
                <Stat
                  label="Uso presupuesto"
                  value={
                    summary.totals.budgetUsedPct != null
                      ? `${summary.totals.budgetUsedPct}%`
                      : '—'
                  }
                />
              </div>
              {summary.recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin partes de horas.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 font-medium">Fecha</th>
                      <th className="py-1 font-medium">Empleado</th>
                      <th className="py-1 font-medium">Horas</th>
                      <th className="py-1 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentEntries.map((e) => (
                      <tr key={e.id} className="border-t border-border/30">
                        <td className="py-2">{e.entryDate}</td>
                        <td className="py-2">{e.employee.name}</td>
                        <td className="py-2">{e.hours} h</td>
                        <td className="py-2">
                          <Badge variant={e.invoiced ? 'success' : 'muted'}>
                            {e.invoiced ? 'Facturado' : 'Pendiente'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function TimeEntriesTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [entryDate, setEntryDate] = useState(defaultDate());
  const [hours, setHours] = useState('1');
  const [description, setDescription] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { projectId, employeeId, entryDate, hours, description },
    'time-entry-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'projects'],
    queryFn: () => fetchEmployees({ limit: 100, page: 1 }),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => fetchTimeEntries(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTimeEntry(projectId, {
        employeeId,
        entryDate,
        hours: Number(hours),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDescription('');
      setHours('1');
      markClean();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const employees = employeesData?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Registrar horas</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Proyecto"
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Empleado"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </SelectField>
          <Input label="Fecha" required type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          <Input
            label="Horas"
            required
            type="number"
            min={0.25}
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="2.5"
          />
          <div className="sm:col-span-2">
            <Input
              label="Descripción"
              optionalHint
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reunión de arranque y definición de alcance"
            />
          </div>
        </div>
        <Button
          loading={createMutation.isPending}
          disabled={!projectId || !employeeId || !hours}
          onClick={() => createMutation.mutate()}
        >
          Registrar parte
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Partes de horas</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : entries.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Sin partes registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Proyecto</th>
                <th className="px-4 py-2 font-medium">Empleado</th>
                <th className="px-4 py-2 font-medium text-right">Horas</th>
                <th className="px-4 py-2 font-medium text-right">Importe</th>
                <th className="px-4 py-2 font-medium">Factura</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-border/30">
                  <td className="px-4 py-2">{e.entryDate}</td>
                  <td className="px-4 py-2">{e.project?.name ?? '—'}</td>
                  <td className="px-4 py-2">{e.employee?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{e.hours} h</td>
                  <td className="px-4 py-2 text-right">{formatMoney(e.amount)}</td>
                  <td className="px-4 py-2">
                    {e.invoice ? (
                      <Link
                        to={`/invoices/${e.invoice.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {e.invoice.number}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Badge variant="muted">Pendiente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!e.invoiceId && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (confirm('¿Eliminar parte?')) deleteMutation.mutate(e.id);
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
