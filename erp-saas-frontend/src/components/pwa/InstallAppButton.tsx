import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

type Props = {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  /** Si true, muestra texto de ayuda cuando el navegador no ofrece instalar. */
  showHelpWhenUnavailable?: boolean;
};

export function InstallAppButton({
  variant = 'secondary',
  className,
  showHelpWhenUnavailable = false,
}: Props) {
  const { canInstall, installed, promptReady, install } = usePwaInstall();

  if (installed) return null;

  if (canInstall) {
    return (
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => void install()}
      >
        <Download className="h-4 w-4" />
        Instalar app
      </Button>
    );
  }

  if (!showHelpWhenUnavailable || !promptReady) return null;

  return (
    <p className="max-w-md text-sm text-muted-foreground">
      Para instalar Domo como app, ábrelo en <strong className="font-medium text-foreground">Google Chrome</strong> o{' '}
      <strong className="font-medium text-foreground">Microsoft Edge</strong> (en Arc u otros no suele
      aparecer). Luego usa el icono de instalar en la barra de dirección, o el botón de esta página.
    </p>
  );
}
