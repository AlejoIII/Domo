import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useTabbedPageGuard } from '@/hooks/useTabbedPageGuard';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { formatMoney } from '@/lib/format';
import {
  createBankAccount,
  createBankMovement,
  deleteBankAccount,
  fetchBankAccounts,
  fetchBankMovements,
  fetchReconciliationBoard,
  importBankMovements,
  reconcileMovement,
  unreconcileMovement,
} from '@/services/treasury.service';

const tabs = [
  { id: 'accounts', label: 'Cuentas' },
  { id: 'movements', label: 'Movimientos' },
  { id: 'reconciliation', label: 'Conciliación' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function TreasuryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'accounts',
  );
  const { setTabDirty, switchTab, dialog } = useTabbedPageGuard();

  const selectTab = (next: TabId) => {
    switchTab(next, tab, (t) => {
      setTab(t);
      setSearchParams({ tab: t }, { replace: true });
    });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold">Tesorería</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas bancarias, movimientos, importación CSV y conciliación con cobros
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && <AccountsTab onDirtyChange={setTabDirty} />}
      {tab === 'movements' && <MovementsTab onDirtyChange={setTabDirty} />}
      {tab === 'reconciliation' && <ReconciliationTab onDirtyChange={setTabDirty} />}
    </div>
  );
}

function AccountsTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const { isDirty, markClean } = useDraftDirty(
    { name, iban, bankName, openingBalance },
    'accounts-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: fetchBankAccounts,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBankAccount({
        name: name.trim(),
        iban: iban.trim() || undefined,
        bankName: bankName.trim() || undefined,
        openingBalance: Number(openingBalance) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] });
      setName('');
      setIban('');
      setBankName('');
      setOpeningBalance('0');
      markClean();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva cuenta bancaria</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cuenta principal BBVA" />
          <Input label="Banco" optionalHint value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BBVA" />
          <Input label="IBAN" optionalHint value={iban} onChange={(e) => setIban(e.target.value)} placeholder="ES12 3456 7890 1234 5678 9012" />
          <Input
            label="Saldo inicial"
            optionalHint
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button
          loading={createMutation.isPending}
          disabled={!name.trim()}
          onClick={() => createMutation.mutate()}
        >
          Crear cuenta
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Cuentas bancarias</h2>
        </div>
        {accounts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No hay cuentas bancarias.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">IBAN</th>
                <th className="px-4 py-2 font-medium text-right">Saldo actual</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-border/30">
                  <td className="px-4 py-2">
                    <p className="font-medium">{acc.name}</p>
                    {acc.bankName && (
                      <p className="text-xs text-muted-foreground">{acc.bankName}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{acc.iban ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatMoney(acc.currentBalance)}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={acc.isActive ? 'success' : 'muted'}>
                      {acc.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (confirm(`¿Eliminar la cuenta "${acc.name}"?`)) {
                          deleteMutation.mutate(acc.id);
                        }
                      }}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function MovementsTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [bankAccountId, setBankAccountId] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState({
    from: defaultFrom(),
    to: defaultTo(),
    bankAccountId: '',
    status: '',
  });

  const [newAccountId, setNewAccountId] = useState('');
  const [newDate, setNewDate] = useState(defaultTo());
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'in' | 'out'>('in');
  const [newReference, setNewReference] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importAccountId, setImportAccountId] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    {
      newAccountId,
      newDate,
      newDescription,
      newAmount,
      newReference,
      newType,
      csvText,
      importAccountId,
    },
    'movements-draft',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: accounts = [] } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: fetchBankAccounts,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['treasury', 'movements', page, applied],
    queryFn: () =>
      fetchBankMovements({
        page,
        limit: 25,
        from: applied.from || undefined,
        to: applied.to || undefined,
        bankAccountId: applied.bankAccountId || undefined,
        status: (applied.status as 'pending' | 'reconciled') || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBankMovement({
        bankAccountId: newAccountId,
        movementDate: newDate,
        description: newDescription.trim(),
        amount: Number(newAmount),
        type: newType,
        reference: newReference.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      setNewDescription('');
      setNewAmount('');
      setNewReference('');
      markClean();
    },
  });

  const importMutation = useMutation({
    mutationFn: () => importBankMovements({ bankAccountId: importAccountId, csv: csvText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      setCsvText('');
      setImportAccountId('');
      markClean();
    },
  });

  const unreconcileMutation = useMutation({
    mutationFn: unreconcileMovement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treasury'] }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <AccountSelect
          label="Cuenta"
          accounts={accounts}
          value={bankAccountId}
          onChange={setBankAccountId}
          allowAll
        />
        <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="flex min-w-[140px] flex-col gap-1">
          <label className="text-sm font-medium">Estado</label>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="reconciled">Conciliado</option>
          </select>
        </div>
        <Button
          onClick={() => {
            setApplied({ from, to, bankAccountId, status });
            setPage(1);
          }}
        >
          Aplicar
        </Button>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Movimiento manual</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Cuenta bancaria"
            required
            value={newAccountId}
            onChange={(e) => setNewAccountId(e.target.value)}
          >
            <option value="">Seleccionar cuenta…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectField>
          <Input label="Fecha" required type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Input
            label="Concepto"
            required
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Cobro factura FAC-20260726-0001"
          />
          <Input
            label="Importe"
            required
            type="number"
            min={0.01}
            step="0.01"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="0.00"
          />
          <SelectField
            label="Tipo"
            required
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'in' | 'out')}
          >
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
          </SelectField>
          <Input
            label="Referencia"
            optionalHint
            value={newReference}
            onChange={(e) => setNewReference(e.target.value)}
            placeholder="TRF-20260726-0001"
          />
        </div>
        <Button
          loading={createMutation.isPending}
          disabled={!newAccountId || !newDescription.trim() || !newAmount}
          onClick={() => createMutation.mutate()}
        >
          Registrar movimiento
        </Button>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <h2 className="font-semibold">Importar CSV</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Formato: fecha;concepto;importe (positivo=entrada, negativo=salida) o fecha;concepto;importe;tipo
        </p>
        <FormRequiredLegend />
        <SelectField
          label="Cuenta bancaria"
          required
          value={importAccountId}
          onChange={(e) => setImportAccountId(e.target.value)}
        >
          <option value="">Seleccionar cuenta…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          placeholder={'fecha;concepto;importe\n2026-07-01;Cobro cliente;500\n2026-07-02;Comisión;-2.50'}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <Button
          variant="secondary"
          loading={importMutation.isPending}
          disabled={!importAccountId || !csvText.trim()}
          onClick={() => importMutation.mutate()}
        >
          <Download className="h-4 w-4" />
          Importar movimientos
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Movimientos bancarios</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Sin movimientos en el periodo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Cuenta</th>
                <th className="px-4 py-2 font-medium">Concepto</th>
                <th className="px-4 py-2 font-medium text-right">Importe</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-border/30">
                  <td className="px-4 py-2 text-muted-foreground">{m.movementDate}</td>
                  <td className="px-4 py-2">{m.bankAccount?.name ?? '—'}</td>
                  <td className="px-4 py-2">
                    <p>{m.description}</p>
                    {m.payment?.invoice && (
                      <p className="text-xs text-muted-foreground">
                        Factura {m.payment.invoice.number}
                      </p>
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      m.type === 'in' ? 'text-success' : 'text-red-600'
                    }`}
                  >
                    {m.type === 'in' ? '+' : '−'}
                    {formatMoney(m.amount)}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={m.status === 'reconciled' ? 'success' : 'muted'}>
                      {m.status === 'reconciled' ? 'Conciliado' : 'Pendiente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {m.status === 'reconciled' && (
                      <Button
                        variant="secondary"
                        loading={unreconcileMutation.isPending}
                        onClick={() => {
                          if (
                            !confirm(
                              '¿Desconciliar este movimiento? El cobro quedará pendiente de conciliar de nuevo.',
                            )
                          ) {
                            return;
                          }
                          unreconcileMutation.mutate(m.id);
                        }}
                      >
                        Desconciliar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Página {meta.page} de {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReconciliationTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [bankAccountId, setBankAccountId] = useState('');

  useEffect(() => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const { data: accounts = [] } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: fetchBankAccounts,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['treasury', 'reconciliation', bankAccountId],
    queryFn: () => fetchReconciliationBoard(bankAccountId || undefined),
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ movementId, paymentId }: { movementId: string; paymentId: string }) =>
      reconcileMovement(movementId, paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treasury'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <AccountSelect
          label="Filtrar por cuenta (opcional)"
          accounts={accounts}
          value={bankAccountId}
          onChange={setBankAccountId}
          allowAll
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3">
            <h2 className="font-semibold">Entradas pendientes de conciliar</h2>
          </div>
          {(data?.pendingMovements.length ?? 0) === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No hay entradas pendientes.</p>
          ) : (
            <div className="divide-y divide-border/30">
              {data?.pendingMovements.map((m) => (
                <div key={m.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.movementDate} · {m.bankAccount?.name}
                      </p>
                    </div>
                    <p className="font-semibold text-success">+{formatMoney(m.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3">
            <h2 className="font-semibold">Cobros sin conciliar</h2>
          </div>
          {(data?.unmatchedPayments.length ?? 0) === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No hay cobros pendientes.</p>
          ) : (
            <div className="divide-y divide-border/30">
              {data?.unmatchedPayments.map((p) => (
                <div key={p.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">Factura {p.invoice.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.paymentDate} · {p.invoice.client?.name ?? 'Cliente'}
                      </p>
                    </div>
                    <p className="font-semibold">{formatMoney(p.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold">Sugerencias de conciliación</h2>
          <p className="text-xs text-muted-foreground">
            Coincidencias por importe y fecha (±7 días)
          </p>
        </div>
        {(data?.suggestions.length ?? 0) === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Sin sugerencias automáticas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Movimiento</th>
                <th className="px-4 py-2 font-medium">Pago / factura</th>
                <th className="px-4 py-2 font-medium">Motivo</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {data?.suggestions.map((s) => {
                const movement = data.pendingMovements.find((m) => m.id === s.movementId);
                const payment = data.unmatchedPayments.find((p) => p.id === s.paymentId);
                if (!movement || !payment) return null;
                return (
                  <tr key={`${s.movementId}:${s.paymentId}`} className="border-b border-border/30">
                    <td className="px-4 py-2">
                      <p>{movement.description}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(movement.amount)}</p>
                    </td>
                    <td className="px-4 py-2">
                      <p>{payment.invoice.number}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(payment.amount)}</p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{s.reason}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        loading={reconcileMutation.isPending}
                        onClick={() =>
                          reconcileMutation.mutate({
                            movementId: s.movementId,
                            paymentId: s.paymentId,
                          })
                        }
                      >
                        Conciliar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function AccountSelect({
  label = 'Cuenta bancaria',
  accounts,
  value,
  onChange,
  allowAll = false,
}: {
  label?: string;
  accounts: Array<{ id: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
}) {
  return (
    <div className="flex min-w-[200px] flex-col gap-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowAll && <option value="">Todas</option>}
        {!allowAll && <option value="">Seleccionar cuenta…</option>}
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
