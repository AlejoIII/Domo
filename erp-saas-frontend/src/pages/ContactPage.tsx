import { Link } from 'react-router-dom';
import { Building2, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { getLegalEntity } from '@/lib/legal';

export function ContactPage() {
  const legal = getLegalEntity();
  const subjectSales = encodeURIComponent('Consulta comercial sobre Domo');
  const subjectSupport = encodeURIComponent('Soporte Domo');
  const mailtoSales = `mailto:${legal.supportEmail}?subject=${subjectSales}`;
  const mailtoSupport = `mailto:${legal.supportEmail}?subject=${subjectSupport}`;
  const mailtoPrivacy = `mailto:${legal.privacyEmail}?subject=${encodeURIComponent('Consulta privacidad Domo')}`;

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-14 sm:py-20">
      <MarketingPageHeader
        align="center"
        eyebrow="Contacto"
        title="Hablemos"
        description="Respondemos en días laborables sobre demos, planes Enterprise, soporte técnico y privacidad."
        className="mx-auto"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="flex flex-col p-6 text-center shadow-sm sm:text-left">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="font-semibold">Ventas y demos</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Plan Enterprise, volumen de usuarios, integraciones o una demo guiada del producto.
          </p>
          <a href={mailtoSales} className="mt-4 block">
            <Button className="w-full" variant="secondary">
              Escribir a ventas
            </Button>
          </a>
        </Card>

        <Card className="flex flex-col border-primary/20 p-6 text-center shadow-sm ring-1 ring-primary/10 sm:text-left">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="font-semibold">Soporte general</h2>
          <p className="mt-2 text-sm text-muted-foreground">Correo principal de contacto</p>
          <a
            href={mailtoSupport}
            className="mt-2 break-all text-lg font-semibold text-primary hover:underline"
          >
            {legal.supportEmail}
          </a>
          <a href={mailtoSupport} className="mt-4 block">
            <Button className="w-full">Abrir cliente de correo</Button>
          </a>
        </Card>

        <Card className="flex flex-col p-6 text-center shadow-sm sm:text-left">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="font-semibold">Privacidad y datos</h2>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Ejercicio de derechos, DPA o consultas sobre tratamiento de datos personales.
          </p>
          <a
            href={mailtoPrivacy}
            className="mt-2 break-all text-sm font-medium text-primary hover:underline"
          >
            {legal.privacyEmail}
          </a>
        </Card>
      </div>

      {!legal.isConfigured && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-200">
          Configura <code className="text-xs">VITE_LEGAL_SUPPORT_EMAIL</code> y datos legales antes
          del lanzamiento público.
        </p>
      )}

      <Card className="p-6 sm:p-8">
        <h2 className="font-semibold">Información legal</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {legal.companyName && (
            <>
              <dt className="text-muted-foreground">Prestador del servicio</dt>
              <dd className="font-medium">
                {legal.companyName}
                {legal.cif ? ` — ${legal.cif}` : ''}
              </dd>
            </>
          )}
          {legal.address && (
            <>
              <dt className="text-muted-foreground">Dirección</dt>
              <dd>{legal.address}</dd>
            </>
          )}
        </dl>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-primary hover:underline">
            Términos de uso
          </Link>
          <Link to="/privacy" className="text-primary hover:underline">
            Política de privacidad
          </Link>
          <Link to="/status" className="text-primary hover:underline">
            Estado del servicio
          </Link>
        </div>
      </Card>
    </div>
  );
}
