import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormLabel, FormRequiredLegend } from '@/components/forms/FormLabel';
import { htmlToPlainText } from '@/lib/html';
import { SelectField } from '@/components/forms/SelectField';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  fetchCrmEmailSettings,
  fetchCrmEmailTemplates,
  updateCrmEmailSettings,
} from '@/services/crm-config.service';

export function CrmEmailSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fromName: '',
    fromEmail: '',
    replyTo: '',
    copyTo: '',
    signatureHtml: '',
    defaultEmailTemplateId: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['crm-email-settings'],
    queryFn: fetchCrmEmailSettings,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['crm-email-templates'],
    queryFn: fetchCrmEmailTemplates,
  });

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.isActive),
    [templates],
  );

  const selectedTemplate = useMemo(
    () => activeTemplates.find((t) => t.id === form.defaultEmailTemplateId) ?? null,
    [activeTemplates, form.defaultEmailTemplateId],
  );

  const { isDirty, markClean, resetBaseline } = useDraftDirty(form, settings?.id ?? 'settings');
  const { dialog } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!settings) return;
    const nextForm = {
      fromName: settings.fromName ?? '',
      fromEmail: settings.fromEmail ?? '',
      replyTo: settings.replyTo ?? '',
      copyTo: settings.copyTo ?? '',
      signatureHtml: settings.signatureHtml ?? '',
      defaultEmailTemplateId: settings.defaultEmailTemplateId ?? '',
    };
    setForm(nextForm);
    resetBaseline(nextForm, settings.id);
  }, [settings, resetBaseline]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCrmEmailSettings({
        fromName: form.fromName.trim() || undefined,
        fromEmail: form.fromEmail.trim() || undefined,
        replyTo: form.replyTo.trim() || undefined,
        copyTo: form.copyTo.trim() || undefined,
        signatureHtml: form.signatureHtml || undefined,
        defaultEmailTemplateId: form.defaultEmailTemplateId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-email-settings'] });
      markClean();
    },
  });

  return (
    <div className="space-y-6">
      {dialog}
      <div>
        <Link
          to="/crm/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Configuración CRM
        </Link>
        <h1 className="text-2xl font-bold">Configuración emails</h1>
        <p className="text-sm text-muted-foreground">
          Remitente, plantilla por defecto y firma para comunicaciones del CRM
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : (
        <Card className="space-y-4 p-6">
          <FormRequiredLegend />

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <SelectField
              label="Plantilla de email"
              optionalHint
              value={form.defaultEmailTemplateId}
              onChange={(e) => setForm((f) => ({ ...f, defaultEmailTemplateId: e.target.value }))}
            >
              <option value="">Sin plantilla por defecto</option>
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.subject}
                </option>
              ))}
            </SelectField>
            {activeTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay plantillas activas.{' '}
                <Link to="/crm/settings/templates" className="text-primary hover:underline">
                  Crear plantillas
                </Link>
              </p>
            )}
            {selectedTemplate && (
              <div className="rounded-md border border-border/50 bg-background p-3 text-sm">
                <p className="font-medium">{selectedTemplate.subject}</p>
                <p className="mt-1 line-clamp-3 text-muted-foreground">
                  {htmlToPlainText(selectedTemplate.bodyHtml)}
                </p>
              </div>
            )}
            <Link to="/crm/settings/templates" className="text-sm text-primary hover:underline">
              Gestionar plantillas
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre remitente"
              optionalHint
              value={form.fromName}
              onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
              placeholder="Mi Empresa"
            />
            <Input
              label="Email remitente"
              type="email"
              optionalHint
              value={form.fromEmail}
              onChange={(e) => setForm((f) => ({ ...f, fromEmail: e.target.value }))}
              placeholder="crm@miempresa.com"
            />
            <Input
              label="Responder a"
              type="email"
              optionalHint
              value={form.replyTo}
              onChange={(e) => setForm((f) => ({ ...f, replyTo: e.target.value }))}
              placeholder="comercial@miempresa.com"
            />
            <Input
              label="Copia oculta (BCC)"
              type="email"
              optionalHint
              value={form.copyTo}
              onChange={(e) => setForm((f) => ({ ...f, copyTo: e.target.value }))}
              placeholder="registro@miempresa.com"
            />
          </div>

          <label className="block text-sm">
            <FormLabel optionalHint className="mb-1 block">
              Firma HTML
            </FormLabel>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
              value={form.signatureHtml}
              onChange={(e) => setForm((f) => ({ ...f, signatureHtml: e.target.value }))}
              placeholder="<p>Saludos,<br/>Equipo comercial</p>"
            />
          </label>

          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Guardar configuración
          </Button>
        </Card>
      )}
    </div>
  );
}
