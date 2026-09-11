import { LegalPage } from '@/components/legal/LegalPage';
import { getLegalEntity } from '@/lib/legal';

export function TermsPage() {
  const legal = getLegalEntity();

  return (
    <LegalPage title="Términos de servicio" updated="27 de julio de 2026">
      {!legal.isConfigured && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
          Documento en borrador: configura <code>VITE_LEGAL_*</code> antes del lanzamiento público.
        </p>
      )}
      <p>
        Al usar Domo aceptas estos términos. El servicio se presta en modalidad SaaS: tú conservas
        la titularidad de los datos que introduces en la plataforma.
      </p>
      <h2>Prestador</h2>
      <p>
        <strong>{legal.companyName}</strong>
        {legal.cif ? <> — {legal.cif}</> : null}
        <br />
        {legal.address}
      </p>
      <h2>Uso permitido</h2>
      <p>
        Debes utilizar Domo de forma lícita, sin intentar acceder a datos de otras empresas ni
        comprometer la seguridad del sistema. Eres responsable de las cuentas de tu organización.
      </p>
      <h2>Planes y facturación</h2>
      <p>
        Los precios y límites de cada plan se describen en la aplicación. Las suscripciones de pago
        se gestionan mediante Stripe. Puedes cancelar desde el portal de facturación.
      </p>
      <h2>Disponibilidad</h2>
      <p>
        Nos esforzamos por mantener el servicio disponible, pero no garantizamos uptime del 100%.
        Podemos programar mantenimientos con aviso previo cuando sea posible.
      </p>
      <h2>Limitación de responsabilidad</h2>
      <p>
        Domo se ofrece &quot;tal cual&quot;. No somos responsables de decisiones contables, fiscales o
        comerciales tomadas únicamente con base en la información mostrada en la app.
        Domo no sustituye el asesoramiento de un profesional colegiado.
      </p>
      <h2>Contacto</h2>
      <p>
        Para incidencias legales o contractuales:{' '}
        <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.
      </p>
    </LegalPage>
  );
}
