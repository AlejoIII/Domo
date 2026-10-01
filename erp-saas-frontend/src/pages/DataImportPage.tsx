import { Navigate } from 'react-router-dom';

/** Ruta legacy: la importación vive en Configuración → Importación. */
export function DataImportPage() {
  return <Navigate to="/settings?tab=import" replace />;
}
