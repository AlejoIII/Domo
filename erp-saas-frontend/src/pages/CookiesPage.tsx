import { LegalPage } from '@/components/legal/LegalPage';

export function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" updated="26 de julio de 2026">
      <p>
        Domo usa cookies y almacenamiento local para que la aplicación funcione correctamente.
      </p>
      <h2>Cookies esenciales</h2>
      <ul>
        <li><strong>domo_at / domo_rt</strong> — sesión autenticada (httpOnly).</li>
        <li><strong>domo-auth</strong> — preferencias mínimas de sesión en el navegador.</li>
        <li><strong>domo-cookie-consent</strong> — recuerda tu elección de cookies.</li>
      </ul>
      <h2>Cookies analíticas (opcionales)</h2>
      <p>
        Solo si aceptas &quot;Aceptar todo&quot;, podemos cargar Sentry para detectar errores y medir
        rendimiento. Puedes rechazarlas y seguir usando Domo con cookies esenciales.
      </p>
      <h2>Gestión</h2>
      <p>
        Puedes borrar cookies desde tu navegador. Al hacerlo se cerrará la sesión y volverás a ver
        el banner de consentimiento.
      </p>
    </LegalPage>
  );
}
