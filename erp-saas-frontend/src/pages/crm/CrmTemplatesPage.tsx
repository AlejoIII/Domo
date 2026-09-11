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
  createCrmEmailTemplate,
  deleteCrmEmailTemplate,
  fetchCrmEmailTemplates,
  updateCrmEmailTemplate,
} from '@/services/crm-config.service';
import type { CrmEmailTemplate } from '@/types/crm-config.types';

const emptyForm = {
  name: '',
  subject: '',
  bodyHtml: '<p>Hola {{nombre}},</p>\n<p></p>\n<p>Saludos,</p>',
  bodyText: '',
  isActive: true,
};

export function CrmTemplatesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CrmEmailTemplate | null>(null);
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
    queryKey: ['crm-email-templates'],
    queryFn: fetchCrmEmailTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        bodyHtml: form.bodyHtml,
        bodyText: form.bodyText.trim() || undefined,
        isDefault: false,
        isActive: form.isActive,
      };
      if (editing) return updateCrmEmailTemplate(editing.id, payload);
      return createCrmEmailTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] });
      markClean();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrmEmailTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: CrmEmailTemplate) => {
    setEditing(item);
    setForm({
      name: item.name,
      subject: item.subject,
      bodyHtml: item.bodyHtml,
      bodyText: item.bodyText ?? '',
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
          <h1 className="text-2xl font-bold">Plantillas de email</h1>
          <p className="text-sm text-muted-foreground">
            Crea y edita plantillas HTML. La plantilla activa por defecto se elige en{' '}
            <Link to="/crm/settings/email" className="text-primary hover:underline">
              Configuración emails
            </Link>
            . Variables: {'{{nombre}}'}, {'{{empresa}}'}, {'{{email}}'}, {'{{telefono}}'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4 p-4">
          <h2 className="font-semibold">{editing ? 'Editar' : 'Nueva'} plantilla</h2>
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Bienvenida a nuevos leads"
            />
            <Input
              label="Asunto"
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Seguimiento de tu presupuesto"
            />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Cuerpo HTML</span>
            <textarea
              className="min-h-[160px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
              value={form.bodyHtml}
              onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
              placeholder={'<p>Hola {{nombre}},</p>\n<p>Te escribo sobre {{empresa}}…</p>'}
            />
          </label>
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
              disabled={!form.name.trim() || !form.subject.trim() || !form.bodyHtml.trim()}
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
          <p className="p-6 text-center text-muted-foreground">No hay plantillas de email.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Asunto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.subject}</td>
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
