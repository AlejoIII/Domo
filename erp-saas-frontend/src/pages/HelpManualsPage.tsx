import { useQuery } from '@tanstack/react-query';
import { Download, BookOpen, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

interface ManualManifestEntry {
  id: string;
  title: string;
  module: string;
  file: string;
  summary: string;
  planNote?: string | null;
}

interface ManualManifest {
  generatedAt: string;
  meta: { product: string; version: string };
  manuals: ManualManifestEntry[];
}

async function fetchManifest(): Promise<ManualManifest> {
  const res = await fetch('/manuals/manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se encontraron manuales. Ejecuta manuals:generate en el backend.');
  return res.json() as Promise<ManualManifest>;
}

export function HelpManualsPage() {
  const query = useQuery({
    queryKey: ['help-manuals'],
    queryFn: fetchManifest,
  });

  const data = query.data;
  const byModule = data?.manuals.reduce<Record<string, ManualManifestEntry[]>>((acc, m) => {
    (acc[m.module] ??= []).push(m);
    return acc;
  }, {}) ?? {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-7 w-7 text-primary" />
          Manuales de uso
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guías paso a paso en PDF con el estilo Domo. Descárgalas y compártelas con tu equipo.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Índice completo</p>
          <p className="text-sm text-muted-foreground">Listado de todos los apartados disponibles.</p>
        </div>
        <a href="/manuals/domo-manual-indice.pdf" download>
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Descargar índice PDF
          </Button>
        </a>
      </Card>

      {query.isLoading && (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      )}

      {query.isError && (
        <Card className="p-6 text-sm text-red-600">
          No se pudieron cargar los manuales. Asegúrate de haber generado los PDF (
          <code className="text-xs">npm run manuals:generate</code> en el backend).
        </Card>
      )}

      {data && (
        <div className="space-y-8">
          {Object.entries(byModule).map(([module, items]) => (
            <section key={module}>
              <h2 className="mb-3 text-lg font-semibold text-primary">{module}</h2>
              <ul className="space-y-3">
                {items.map((manual) => (
                  <li key={manual.id}>
                    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="font-medium">{manual.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{manual.summary}</p>
                            {manual.planNote && (
                              <p className="mt-1 text-xs text-primary">{manual.planNote}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <a href={`/manuals/${manual.file}`} download className="shrink-0">
                        <Button variant="secondary" className="w-full sm:w-auto">
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      </a>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
