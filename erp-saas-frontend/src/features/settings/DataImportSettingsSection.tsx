import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { usePermissions } from '@/hooks/usePermissions';
import {
  downloadTextFile,
  fetchDataImportTemplate,
  importClientsCsv,
  importProductsCsv,
  importWarehousesCsv,
} from '@/services/data-import.service';
import type { DataImportKind, DataImportResult } from '@/types/data-import.types';

const KINDS: Array<{
  id: DataImportKind;
  label: string;
  hint: string;
  permission: 'products.write' | 'clients.write';
  order: number;
}> = [
  {
    id: 'warehouses',
    label: 'Almacenes',
    hint: 'codigo;nombre;direccion;ciudad;notas',
    permission: 'products.write',
    order: 1,
  },
  {
    id: 'products',
    label: 'Productos',
    hint: 'codigo;nombre;precio;coste;stock;stock_minimo;categoria;almacen;descripcion',
    permission: 'products.write',
    order: 2,
  },
  {
    id: 'clients',
    label: 'Clientes',
    hint: 'nombre;email;telefono;nif;direccion;ciudad;cp;pais;notas',
    permission: 'clients.write',
    order: 3,
  },
];

function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  const msg = err.response?.data?.message;
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) return msg.join(', ');
  return fallback;
}

export function DataImportSettingsSection() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const availableKinds = KINDS.filter((k) => hasPermission(k.permission)).sort(
    (a, b) => a.order - b.order,
  );

  const [kind, setKind] = useState<DataImportKind>(
    () => availableKinds[0]?.id ?? 'warehouses',
  );
  const [csvText, setCsvText] = useState('');
  const [defaultWarehouseCode, setDefaultWarehouseCode] = useState('');
  const [lastResult, setLastResult] = useState<DataImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = KINDS.find((k) => k.id === kind) ?? KINDS[0];
  const canImport = hasPermission(active.permission);

  const invalidateCatalog = (importKind: DataImportKind) => {
    if (importKind === 'clients') {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
    if (importKind === 'products') {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    }
    if (importKind === 'warehouses' || importKind === 'products') {
      void queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const importMutation = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const payload = { csv: csvText, dryRun };
      if (kind === 'warehouses') return importWarehousesCsv(payload);
      if (kind === 'clients') return importClientsCsv(payload);
      return importProductsCsv({
        ...payload,
        defaultWarehouseCode: defaultWarehouseCode.trim() || undefined,
      });
    },
    onSuccess: (result) => {
      setLastResult(result);
      setError(null);
      if (!result.dryRun && result.created > 0) {
        invalidateCatalog(kind);
        if (result.skipped === 0) {
          setCsvText('');
        }
      }
    },
    onError: (err) => {
      setLastResult(null);
      setError(apiErrorMessage(err, 'Error al importar'));
    },
  });

  const templateMutation = useMutation({
    mutationFn: () => fetchDataImportTemplate(kind),
    onSuccess: ({ filename, content }) => downloadTextFile(filename, content),
    onError: (err) => setError(apiErrorMessage(err, 'No se pudo descargar la plantilla')),
  });

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setLastResult(null);
      setError(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  if (availableKinds.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Importación masiva</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu rol no incluye permisos para importar almacenes, productos o clientes. Pide a un
          administrador que te asigne <strong>products.write</strong> o <strong>clients.write</strong>.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-6">
        <h2 className="text-lg font-semibold">Importación masiva (CSV)</h2>
        <p className="text-sm text-muted-foreground">
          Carga datos iniciales o migraciones desde Excel/LibreOffice (guardar como CSV UTF-8).
          Orden recomendado: <strong>almacenes → productos → clientes</strong>. Máximo{' '}
          <strong>500 filas</strong> por archivo; los errores por fila no detienen el resto.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {availableKinds.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              setKind(k.id);
              setLastResult(null);
              setError(null);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              kind === k.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <h3 className="font-semibold">{active.label}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          La <strong>primera fila del CSV</strong> debe ser la cabecera (p. ej.{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{active.hint.split(';')[0]};…</code>
          ). Columnas completas: {active.hint}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={templateMutation.isPending}
            disabled={!canImport}
            onClick={() => templateMutation.mutate()}
          >
            <Download className="h-4 w-4" />
            Descargar plantilla
          </Button>
          <Button
            variant="secondary"
            disabled={!canImport}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Elegir archivo CSV
          </Button>
          {csvText.trim() && (
            <Button
              type="button"
              variant="ghost"
              disabled={!canImport}
              onClick={() => {
                setCsvText('');
                setLastResult(null);
                setError(null);
              }}
            >
              Vaciar
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {kind === 'products' && (
          <Input
            label="Almacén por defecto (código)"
            optionalHint
            value={defaultWarehouseCode}
            onChange={(e) => setDefaultWarehouseCode(e.target.value)}
            placeholder="ALM01 — si la fila no incluye columna almacen"
          />
        )}

        <textarea
          key={kind}
          className="min-h-[160px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          placeholder="Pega aquí tu CSV o usa «Elegir archivo». La primera fila debe ser la cabecera; las siguientes, los datos."
          value={csvText}
          disabled={!canImport}
          spellCheck={false}
          onChange={(e) => {
            setCsvText(e.target.value);
            setLastResult(null);
          }}
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={importMutation.isPending}
            disabled={!canImport || !csvText.trim()}
            onClick={() => importMutation.mutate(true)}
          >
            Validar sin guardar
          </Button>
          <Button
            loading={importMutation.isPending}
            disabled={!canImport || !csvText.trim()}
            onClick={() => importMutation.mutate(false)}
          >
            Importar
          </Button>
        </div>
      </Card>

      {lastResult && (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Resultado</h3>
            {lastResult.dryRun && <Badge variant="muted">Solo validación</Badge>}
          </div>
          <p className="text-sm">
            <span className="text-green-600 dark:text-green-400">{lastResult.created} correctas</span>
            {lastResult.skipped > 0 && (
              <>
                {' · '}
                <span className="text-amber-600 dark:text-amber-400">
                  {lastResult.skipped} con error
                </span>
              </>
            )}
          </p>
          {lastResult.errors.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-md border border-border/60 text-sm">
              {lastResult.errors.map((e) => (
                <li
                  key={`${e.row}-${e.message}`}
                  className="border-b border-border/40 px-3 py-2 last:border-0"
                >
                  Fila {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
