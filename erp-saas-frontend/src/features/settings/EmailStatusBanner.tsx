import { useQuery } from '@tanstack/react-query';
import { MailCheck, MailWarning } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { fetchEmailStatus } from '@/services/settings.service';

export function EmailStatusBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'email-status'],
    queryFn: fetchEmailStatus,
  });

  if (isLoading) {
    return (
      <Card className="flex justify-center p-4">
        <Loader />
      </Card>
    );
  }

  if (!data) return null;

  const configured = data.configured;
  const Icon = configured ? MailCheck : MailWarning;

  return (
    <Card className={`p-4 ${configured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${configured ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {configured ? 'Email operativo' : 'Email no configurado'}
          </p>
          <p className="text-muted-foreground">
            Proveedor: <strong>{data.provider}</strong>
            {data.verificationEnabled ? ' · Verificación al registrarse activa' : ' · Verificación al registrarse desactivada'}
          </p>
          {!configured && (
            <p className="text-xs text-muted-foreground">
              Configura SMTP o Resend en el backend (`.env`). En desarrollo sin SMTP se usa modo consola y se muestran enlaces/códigos en pantalla.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
