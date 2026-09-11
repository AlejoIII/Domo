import { Link } from 'react-router-dom';
import { ExternalLink, LayoutGrid } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CONFIGURABLE_ENTITIES, ENTITY_FORM_ROUTES } from '@/config/field-definitions';

export function FormLayoutsSettingsSection() {
  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Fichas personalizables</h2>
        <p className="text-sm text-muted-foreground">
          Abre un formulario y pulsa «Personalizar ficha» para cambiar posición, ancho y tipo de
          cada campo. Los cambios se aplican a toda la empresa.
        </p>
      </div>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {CONFIGURABLE_ENTITIES.map((entity) => (
          <li key={entity.id}>
            <Link
              to={ENTITY_FORM_ROUTES[entity.id]}
              className="flex items-center justify-between gap-3 p-3 text-sm transition hover:bg-muted/50"
            >
              <span className="flex items-center gap-2 font-medium">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                {entity.label}
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
