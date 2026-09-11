import type { FallbackRender } from '@sentry/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/** Fallback de última instancia cuando un error de render escapa a todos los boundaries de la app. */
export const AppErrorFallback: FallbackRender = ({ resetError }) => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <Card className="max-w-md space-y-4 p-8 text-center">
      <h1 className="text-lg font-semibold">Algo ha ido mal</h1>
      <p className="text-sm text-muted-foreground">
        Ha ocurrido un error inesperado. Se ha registrado automáticamente y ya lo estamos revisando.
      </p>
      <div className="flex justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            resetError();
            window.location.assign('/dashboard');
          }}
        >
          Volver al inicio
        </Button>
        <Button onClick={() => window.location.reload()}>Recargar página</Button>
      </div>
    </Card>
  </div>
);
