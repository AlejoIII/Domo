import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getLegalEntity } from '@/lib/legal';

export function ContactPage() {
  const legal = getLegalEntity();
  const subject = encodeURIComponent('Consulta sobre Domo');
  const mailto = `mailto:${legal.supportEmail}?subject=${subject}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contacto</h1>
        <p className="mt-3 text-muted-foreground">
          Escríbenos por correo. Respondemos en días laborables sobre demos, planes Enterprise
          y soporte.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">Correo de contacto</p>
        <a
          href={mailto}
          className="mt-1 block break-all text-lg font-semibold text-primary hover:underline"
        >
          {legal.supportEmail}
        </a>
        <div className="mt-6">
          <a href={mailto}>
            <Button className="px-6">Abrir cliente de correo</Button>
          </a>
        </div>
        {!legal.isConfigured && (
          <p className="mt-4 text-xs text-amber-700 dark:text-amber-200">
            Configura <code>VITE_LEGAL_SUPPORT_EMAIL</code> antes del lanzamiento público.
          </p>
        )}
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Privacidad y datos:</strong>{' '}
          <a href={`mailto:${legal.privacyEmail}`} className="text-primary hover:underline">
            {legal.privacyEmail}
          </a>
        </p>
        {legal.companyName && (
          <p>
            <strong className="text-foreground">Prestador:</strong> {legal.companyName}
            {legal.cif ? ` — ${legal.cif}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
