import { LegalPage } from '@/components/legal/LegalPage';
import { getLegalEntity } from '@/lib/legal';

export function PrivacyPage() {
  const legal = getLegalEntity();

  return (
    <LegalPage title="Política de privacidad" updated="27 de julio de 2026">
      {!legal.isConfigured && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
          Documento en borrador: configura <code>VITE_LEGAL_*</code> antes del lanzamiento público.
        </p>
      )}
      <p>
        Esta política describe cómo Domo trata los datos personales cuando usas nuestro ERP en la nube.
      </p>
      <h2>Responsable del tratamiento</h2>
      <p>
        <strong>{legal.companyName}</strong>
        {legal.cif ? <> — CIF/NIF {legal.cif}</> : null}
        <br />
        {legal.address}
        <br />
        Contacto privacidad: <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>
      </p>
      <h2>Datos que recogemos</h2>
      <ul>
        <li>Datos de cuenta: nombre, email, empresa, rol.</li>
        <li>Datos operativos: clientes, productos, documentos que tú introduces.</li>
        <li>Datos técnicos: logs, IP, cookies esenciales de sesión.</li>
        <li>Analítica opcional (solo con tu consentimiento): errores y rendimiento vía Sentry.</li>
      </ul>
      <h2>Finalidad y base legal</h2>
      <p>
        Prestación del servicio (ejecución del contrato), seguridad, facturación y, con consentimiento,
        mejora del producto. No vendemos tus datos a terceros.
      </p>
      <h2>Subencargados</h2>
      <p>
        Podemos usar proveedores como hosting, Stripe (pagos), Resend/SMTP (email) y Sentry (monitorización).
        Todos bajo acuerdos de tratamiento acordes al RGPD.
      </p>
      <h2>Conservación</h2>
      <p>
        Conservamos los datos mientras mantengas la cuenta activa y el tiempo necesario para obligaciones legales
        (p. ej. documentación fiscal).
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, limitar u oponerte al tratamiento contactando con{' '}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
        También puedes reclamar ante la AEPD.
      </p>
    </LegalPage>
  );
}
