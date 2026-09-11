import { Navigate } from 'react-router-dom';

/** Redirige rutas antiguas al hub de plantillas de email. */
export function CrmTemplatesRedirect() {
  return <Navigate to="/crm/settings/templates" replace />;
}
