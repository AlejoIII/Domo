import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useInlineFormGuard } from '@/hooks/useInlineFormGuard';
import {
  createCrmStage,
  deleteCrmStage,
  fetchCrmStages,
  reorderCrmStages,
  updateCrmStage,
} from '@/services/crm.service';
import type { CrmStage } from '@/types/crm.types';

const emptyForm = {
  name: '',
  color: '#6366f1',
  sortOrder: '0',
  isClosed: false,
  outcome: '' as '' | 'won' | 'lost',
};

export function CrmStagesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CrmStage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const { markClean, guardedClose, dialog } = useInlineFormGuard(
    showForm,
    form,
    editing?.id ?? 'new',
    closeForm,
  );

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['crm', 'stages'],
    queryFn: fetchCrmStages,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        color: form.color.trim() || '#6366f1',
        sortOrder: Number(form.sortOrder) || 0,
        isClosed: form.isClosed,
        outcome: form.isClosed ? (form.outcome || null) : null,
      };
      if (editing) return updateCrmStage(editing.id, payload);
      return createCrmStage(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      markClean();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, moveToStageId }: { id: string; moveToStageId?: string }) =>
      deleteCrmStage(id, moveToStageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (next: CrmStage[]) =>
      reorderCrmStages(next.map((stage, index) => ({ id: stage.id, sortOrder: index + 1 }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: String(stages.length + 1) });
    setShowForm(true);
  };

  const openEdit = (stage: CrmStage) => {
    setEditing(stage);
    setForm({
      name: stage.name,
      color: stage.color,
      sortOrder: String(stage.sortOrder),
      isClosed: stage.isClosed,
      outcome: stage.outcome ?? '',
    });
    setShowForm(true);
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    const next = [...stages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next);
  };

  const handleDelete = (stage: CrmStage) => {
    const oppCount = stage._count?.opportunities ?? 0;
    let moveToStageId: string | undefined;

    if (oppCount > 0) {
      const alternatives = stages.filter((s) => s.id !== stage.id);
      if (alternatives.length === 0) {
        alert('No hay otra etapa disponible para mover las oportunidades.');
        return;
      }
      const choice = window.prompt(
        `La etapa "${stage.name}" tiene ${oppCount} oportunidad(es). Indica el ID de la etapa destino:\n${alternatives.map((s) => `${s.name}: ${s.id}`).join('\n')}`,
        alternatives[0]?.id,
      );
      if (!choice) return;
      moveToStageId = choice.trim();
    }

    if (confirm(`¿Eliminar etapa "${stage.name}"?`)) {
      deleteMutation.mutate({ id: stage.id, moveToStageId });
    }
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
      {dialog}
      <div className="flex items-center gap-3">
        <Link to="/crm/settings" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Etapas del pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Configura las columnas del kanban comercial
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Etapas ({stages.length})</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva etapa
          </Button>
        </div>

        {stages.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No hay etapas configuradas.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted disabled:opacity-30"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => moveStage(index, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted disabled:opacity-30"
                    disabled={index === stages.length - 1 || reorderMutation.isPending}
                    onClick={() => moveStage(index, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Orden {stage.sortOrder}
                    {(stage._count?.opportunities ?? 0) > 0 &&
                      ` · ${stage._count?.opportunities} oportunidad(es)`}
                  </p>
                </div>
                {stage.isClosed ? (
                  <Badge variant={stage.outcome === 'won' ? 'success' : 'danger'}>
                    {stage.outcome === 'won' ? 'Ganada' : stage.outcome === 'lost' ? 'Perdida' : 'Cierre'}
                  </Badge>
                ) : (
                  <Badge variant="muted">Abierta</Badge>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(stage)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" onClick={() => handleDelete(stage)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <Card className="space-y-4 p-4">
          <h2 className="font-semibold">{editing ? 'Editar etapa' : 'Nueva etapa'}</h2>
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Propuesta enviada"
            />
            <Input
              label="Color"
              optionalHint
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="#4f46e5"
            />
            <Input
              label="Orden"
              optionalHint
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="10"
            />
            <SelectField
              label="Tipo"
              value={form.isClosed ? 'closed' : 'open'}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isClosed: e.target.value === 'closed',
                  outcome: e.target.value === 'closed' ? f.outcome : '',
                }))
              }
            >
              <option value="open">Abierta</option>
              <option value="closed">Cierre</option>
            </SelectField>
            {form.isClosed && (
              <SelectField
                label="Resultado"
                value={form.outcome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, outcome: e.target.value as '' | 'won' | 'lost' }))
                }
              >
                <option value="">Neutral</option>
                <option value="won">Ganada</option>
                <option value="lost">Perdida</option>
              </SelectField>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              Guardar
            </Button>
            <Button variant="secondary" onClick={guardedClose}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
