import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useInlineFormGuard } from '@/hooks/useInlineFormGuard';
import {
  createCrmAcreliaAccount,
  deleteCrmAcreliaAccount,
  fetchCrmAcreliaAccounts,
  updateCrmAcreliaAccount,
} from '@/services/crm-config.service';
import type { CrmAcreliaAccount } from '@/types/crm-config.types';

const emptyForm = {
  name: '',
  apiKey: '',
  senderId: '',
  notes: '',
  isActive: true,
};

export function CrmAcreliaPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CrmAcreliaAccount | null>(null);
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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['crm-acrelia-accounts'],
    queryFn: fetchCrmAcreliaAccounts,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        apiKey: form.apiKey.trim() || undefined,
        senderId: form.senderId.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) return updateCrmAcreliaAccount(editing.id, payload);
      return createCrmAcreliaAccount(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-acrelia-accounts'] });
      markClean();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrmAcreliaAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-acrelia-accounts'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: CrmAcreliaAccount) => {
    setEditing(item);
    setForm({
      name: item.name,
      apiKey: '',
      senderId: item.senderId ?? '',
      notes: item.notes ?? '',
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/crm/settings"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuración CRM
          </Link>
          <h1 className="text-2xl font-bold">Cuentas Acrelia</h1>
          <p className="text-sm text-muted-foreground">
            Credenciales para la integración con Acrelia (SMS / email marketing)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        Configura las cuentas Acrelia para enviar SMS desde el CRM (pestaña Leads → icono SMS).
        En desarrollo los mensajes se registran en consola si no hay API configurada.
      </Card>

      {showForm && (
        <Card className="space-y-4 p-4">
          <h2 className="font-semibold">{editing ? 'Editar' : 'Nueva'} cuenta Acrelia</h2>
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Cuenta SMS comercial"
            />
            <Input
              label="Sender ID"
              optionalHint
              value={form.senderId}
              onChange={(e) => setForm((f) => ({ ...f, senderId: e.target.value }))}
              placeholder="MIEMPRESA"
            />
            <Input
              label="API Key"
              type="password"
              optionalHint={!!editing}
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={
                editing?.hasApiKey
                  ? 'Dejar vacío para mantener la actual'
                  : 'ak_live_…'
              }
            />
            <Input
              label="Notas"
              optionalHint
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Cuenta para campañas comerciales"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Activa
          </label>
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

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No hay cuentas Acrelia configuradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Sender ID</th>
                <th className="px-4 py-3 font-medium">API Key</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.senderId ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.hasApiKey ? '••••••••' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'success' : 'muted'}>
                      {item.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" className="rounded p-2 hover:bg-muted" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-2 text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          if (!confirm(`¿Eliminar "${item.name}"?`)) return;
                          deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
