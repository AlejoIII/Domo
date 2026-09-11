import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { SelectField } from '@/components/forms/SelectField';
import {
  fetchCrmAcreliaAccounts,
  fetchCrmEmailSettings,
  fetchCrmEmailTemplates,
} from '@/services/crm-config.service';
import { sendCrmEmail, sendCrmSms } from '@/services/crm.service';

interface SendCommunicationModalProps {
  mode: 'email' | 'sms';
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  contactName?: string;
}

export function SendCommunicationModal({
  mode,
  open,
  onClose,
  defaultTo = '',
  leadId,
  clientId,
  opportunityId,
  contactName,
}: SendCommunicationModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [acreliaAccountId, setAcreliaAccountId] = useState('');

  const { data: emailSettings } = useQuery({
    queryKey: ['crm-email-settings'],
    queryFn: fetchCrmEmailSettings,
    enabled: open && mode === 'email',
  });

  const { data: emailTemplates = [], isLoading: loadingEmailTemplates } = useQuery({
    queryKey: ['crm-email-templates'],
    queryFn: fetchCrmEmailTemplates,
    enabled: open && mode === 'email',
  });

  const { data: acreliaAccounts = [] } = useQuery({
    queryKey: ['crm-acrelia-accounts'],
    queryFn: fetchCrmAcreliaAccounts,
    enabled: open && mode === 'sms',
  });

  useEffect(() => {
    if (!open) return;
    setTo(defaultTo);
    setSubject('');
    setBody('');
    setAcreliaAccountId('');
    setTemplateId(mode === 'email' ? (emailSettings?.defaultEmailTemplateId ?? '') : '');
  }, [open, defaultTo, mode, emailSettings?.defaultEmailTemplateId]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'email') {
        return sendCrmEmail({
          to: to.trim(),
          templateId: templateId || undefined,
          subject: subject.trim() || undefined,
          bodyHtml: body.trim() || undefined,
          leadId,
          clientId,
          opportunityId,
        });
      }
      return sendCrmSms({
        to: to.trim(),
        body: body.trim(),
        acreliaAccountId: acreliaAccountId || undefined,
        leadId,
        clientId,
        opportunityId,
      });
    },
    onSuccess: () => {
      alert(mode === 'email' ? 'Email enviado correctamente' : 'SMS enviado correctamente');
      onClose();
    },
    onError: (error: Error) => {
      alert(error.message || 'No se pudo enviar');
    },
  });

  if (!open) return null;

  const activeTemplates = emailTemplates.filter((t) => t.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            {mode === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            <h2 className="font-semibold">
              Enviar {mode === 'email' ? 'email' : 'SMS'}
              {contactName ? ` a ${contactName}` : ''}
            </h2>
          </div>
          <button type="button" className="rounded p-1 hover:bg-muted" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {mode === 'email' && loadingEmailTemplates ? (
            <div className="flex justify-center py-6">
              <Loader />
            </div>
          ) : (
            <>
              <Input
                label={mode === 'email' ? 'Email destino' : 'Teléfono destino'}
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={mode === 'email' ? 'cliente@empresa.com' : '600 123 456'}
              />
              {mode === 'email' && (
                <>
                  <SelectField
                    label="Plantilla"
                    optionalHint
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <option value="">Sin plantilla (manual)</option>
                    {activeTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </SelectField>
                  <Input
                    label="Asunto"
                    optionalHint={!!templateId}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Seguimiento de tu presupuesto"
                  />
                </>
              )}
              {mode === 'sms' && acreliaAccounts.length > 0 && (
                <SelectField
                  label="Cuenta Acrelia"
                  optionalHint
                  value={acreliaAccountId}
                  onChange={(e) => setAcreliaAccountId(e.target.value)}
                >
                  <option value="">Cuenta activa por defecto</option>
                  {acreliaAccounts.filter((a) => a.isActive).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </SelectField>
              )}
              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {mode === 'email' ? 'Cuerpo HTML' : 'Mensaje'}
                  <span className="text-destructive"> *</span>
                </span>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    mode === 'email'
                      ? 'Opcional si usas plantilla. Variables: {{nombre}}, {{empresa}}…'
                      : 'Escribe el mensaje SMS. Variables: {{nombre}}, {{empresa}}, {{telefono}}'
                  }
                />
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 px-4 py-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={sendMutation.isPending}
            disabled={
              !to.trim() ||
              (mode === 'sms' && !body.trim()) ||
              (mode === 'email' && !templateId && (!body.trim() || !subject.trim()))
            }
            onClick={() => sendMutation.mutate()}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
