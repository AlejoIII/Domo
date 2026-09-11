import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CRM_SETTINGS_LINKS } from '@/config/crm-settings.config';

export function CrmSettingsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración CRM</h1>
        <p className="text-sm text-muted-foreground">
          Catálogos, plantillas de comunicación e integraciones
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Opciones de configuración</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CRM_SETTINGS_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group flex items-start gap-3 rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide">{item.label}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
