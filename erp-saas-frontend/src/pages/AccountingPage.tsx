import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { formatMoney } from '@/lib/format';
import {
  exportJournal,
  fetchAccounts,
  fetchJournal,
  fetchLedger,
  fetchTrialBalance,
} from '@/services/accounting.service';
import type { AccountType } from '@/types/accounting.types';

const tabs = [
  { id: 'chart', label: 'Plan contable' },
  { id: 'journal', label: 'Libro diario' },
  { id: 'ledger', label: 'Libro mayor' },
  { id: 'trial-balance', label: 'Balance' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Patrimonio',
  income: 'Ingreso',
  expense: 'Gasto',
};

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'chart',
  );
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom(), to: defaultTo() });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [exporting, setExporting] = useState(false);

  const selectTab = (next: TabId) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounting', 'accounts'],
    queryFn: fetchAccounts,
  });

  const { data: journal = [], isLoading: loadingJournal } = useQuery({
    queryKey: ['accounting', 'journal', applied],
    queryFn: () => fetchJournal(applied),
    enabled: tab === 'journal',
  });

  const { data: ledger, isLoading: loadingLedger } = useQuery({
    queryKey: ['accounting', 'ledger', selectedAccountId, applied],
    queryFn: () => fetchLedger(selectedAccountId, applied),
    enabled: tab === 'ledger' && !!selectedAccountId,
  });

  const { data: trialBalance, isLoading: loadingTrial } = useQuery({
    queryKey: ['accounting', 'trial-balance', applied],
    queryFn: () => fetchTrialBalance(applied),
    enabled: tab === 'trial-balance',
  });

  const periodFilter = (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      <Button onClick={() => setApplied({ from, to })}>Aplicar</Button>
      {tab === 'journal' && (
        <Button
          variant="secondary"
          className="sm:ml-auto"
          loading={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await exportJournal(applied);
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contabilidad</h1>
        <p className="text-sm text-muted-foreground">
          Plan contable PGCE, asientos automáticos desde facturas y cobros
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

      {tab === 'chart' && (
        <ChartTab accounts={accounts} loading={loadingAccounts} onSelectAccount={(id) => {
          setSelectedAccountId(id);
          selectTab('ledger');
        }} />
      )}

      {tab === 'journal' && (
        <>
          {periodFilter}
          <JournalTab entries={journal} loading={loadingJournal} />
        </>
      )}

      {tab === 'ledger' && (
        <>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex min-w-[220px] flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Cuenta</label>
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">Seleccionar cuenta…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={() => setApplied({ from, to })}>Aplicar</Button>
          </Card>
          <LedgerTab ledger={ledger ?? null} loading={loadingLedger} accountSelected={!!selectedAccountId} />
        </>
      )}

      {tab === 'trial-balance' && (
        <>
          {periodFilter}
          <TrialBalanceTab report={trialBalance ?? null} loading={loadingTrial} />
        </>
      )}
    </div>
  );
}

function ChartTab({
  accounts,
  loading,
  onSelectAccount,
}: {
  accounts: Awaited<ReturnType<typeof fetchAccounts>>;
  loading: boolean;
  onSelectAccount: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-semibold">Plan contable (PGCE simplificado)</h2>
        <p className="text-xs text-muted-foreground">
          Cuentas de sistema generadas automáticamente. Haz clic en una fila para ver el mayor.
        </p>
      </div>
      {accounts.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Sin cuentas configuradas.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Origen</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr
                key={acc.id}
                className="cursor-pointer border-b border-border/30 hover:bg-muted/40"
                onClick={() => onSelectAccount(acc.id)}
              >
                <td className="px-4 py-2 font-mono font-medium">{acc.code}</td>
                <td className="px-4 py-2">{acc.name}</td>
                <td className="px-4 py-2">
                  <Badge variant="default">
                    {ACCOUNT_TYPE_LABELS[acc.type as AccountType] ?? acc.type}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {acc.isSystem ? 'Sistema' : 'Manual'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function JournalTab({
  entries,
  loading,
}: {
  entries: Awaited<ReturnType<typeof fetchJournal>>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          No hay asientos en el periodo. Los asientos se generan al emitir facturas y registrar cobros.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div>
              <span className="font-semibold">Asiento #{entry.entryNumber}</span>
              <span className="ml-3 text-sm text-muted-foreground">{entry.entryDate}</span>
            </div>
            <p className="text-sm">{entry.description}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Cuenta</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium text-right">Debe</th>
                <th className="px-4 py-2 font-medium text-right">Haber</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="px-4 py-2 font-mono">{line.accountCode}</td>
                  <td className="px-4 py-2">{line.accountName}</td>
                  <td className="px-4 py-2 text-right">
                    {line.debit > 0 ? formatMoney(line.debit) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {line.credit > 0 ? formatMoney(line.credit) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-medium">
                <td className="px-4 py-2" colSpan={2}>
                  Totales
                </td>
                <td className="px-4 py-2 text-right">{formatMoney(entry.totalDebit)}</td>
                <td className="px-4 py-2 text-right">{formatMoney(entry.totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

function LedgerTab({
  ledger,
  loading,
  accountSelected,
}: {
  ledger: Awaited<ReturnType<typeof fetchLedger>>;
  loading: boolean;
  accountSelected: boolean;
}) {
  if (!accountSelected) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Selecciona una cuenta para ver sus movimientos.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (!ledger) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudo cargar el libro mayor.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-semibold">
          {ledger.account.code} — {ledger.account.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Saldo final: {formatMoney(ledger.closingBalance)}
        </p>
      </div>
      {ledger.movements.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Sin movimientos en el periodo.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Asiento</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Descripción</th>
              <th className="px-4 py-2 font-medium text-right">Debe</th>
              <th className="px-4 py-2 font-medium text-right">Haber</th>
              <th className="px-4 py-2 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {ledger.movements.map((m, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="px-4 py-2">#{m.entryNumber}</td>
                <td className="px-4 py-2 text-muted-foreground">{m.entryDate}</td>
                <td className="px-4 py-2">{m.description}</td>
                <td className="px-4 py-2 text-right">
                  {m.debit > 0 ? formatMoney(m.debit) : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  {m.credit > 0 ? formatMoney(m.credit) : '—'}
                </td>
                <td className="px-4 py-2 text-right font-medium">{formatMoney(m.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function TrialBalanceTab({
  report,
  loading,
}: {
  report: Awaited<ReturnType<typeof fetchTrialBalance>> | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudo cargar el balance de sumas y saldos.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-semibold">Balance de sumas y saldos</h2>
      </div>
      {report.rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Sin movimientos en el periodo.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium text-right">Debe</th>
              <th className="px-4 py-2 font-medium text-right">Haber</th>
              <th className="px-4 py-2 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.accountId} className="border-b border-border/30">
                <td className="px-4 py-2 font-mono">{row.code}</td>
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2 text-right">{formatMoney(row.debit)}</td>
                <td className="px-4 py-2 text-right">{formatMoney(row.credit)}</td>
                <td className="px-4 py-2 text-right font-medium">{formatMoney(row.balance)}</td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td className="px-4 py-2" colSpan={2}>
                Totales
              </td>
              <td className="px-4 py-2 text-right">{formatMoney(report.totalDebit)}</td>
              <td className="px-4 py-2 text-right">{formatMoney(report.totalCredit)}</td>
              <td className="px-4 py-2" />
            </tr>
          </tbody>
        </table>
      )}
    </Card>
  );
}
