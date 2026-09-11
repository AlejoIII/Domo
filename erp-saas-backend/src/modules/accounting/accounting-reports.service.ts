import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AccountingChartService } from './accounting-chart.service';

@Injectable()
export class AccountingReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chart: AccountingChartService,
  ) {}

  async getJournal(companyId: string, from?: string, to?: string) {
    await this.chart.ensureDefaultChart(companyId);
    const dateFilter = this.dateRange(from, to);

    const entries = await this.prisma.journalEntry.findMany({
      where: { companyId, ...(dateFilter ? { entryDate: dateFilter } : {}) },
      orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }],
      include: {
        lines: {
          orderBy: { lineOrder: 'asc' },
          include: { account: { select: { code: true, name: true } } },
        },
      },
    });

    return entries.map((e) => ({
      id: e.id,
      entryNumber: e.entryNumber,
      entryDate: e.entryDate.toISOString().slice(0, 10),
      description: e.description,
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      lines: e.lines.map((l) => ({
        accountCode: l.account.code,
        accountName: l.account.name,
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
      totalDebit: e.lines.reduce((s, l) => s + Number(l.debit), 0),
      totalCredit: e.lines.reduce((s, l) => s + Number(l.credit), 0),
    }));
  }

  async getLedger(companyId: string, accountId: string, from?: string, to?: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });
    if (!account) return null;

    const dateFilter = this.dateRange(from, to);
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          ...(dateFilter ? { entryDate: dateFilter } : {}),
        },
      },
      orderBy: [{ entry: { entryDate: 'asc' } }, { entry: { entryNumber: 'asc' } }],
      include: {
        entry: { select: { entryNumber: true, entryDate: true, description: true } },
      },
    });

    let balance = 0;
    const movements = lines.map((l) => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      balance += debit - credit;
      return {
        entryNumber: l.entry.entryNumber,
        entryDate: l.entry.entryDate.toISOString().slice(0, 10),
        description: l.entry.description,
        debit,
        credit,
        balance,
      };
    });

    return {
      account: { id: account.id, code: account.code, name: account.name, type: account.type },
      movements,
      closingBalance: balance,
    };
  }

  async getTrialBalance(companyId: string, from?: string, to?: string) {
    await this.chart.ensureDefaultChart(companyId);
    const dateFilter = this.dateRange(from, to);

    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        account: { companyId },
        entry: {
          companyId,
          ...(dateFilter ? { entryDate: dateFilter } : {}),
        },
      },
      select: { accountId: true, debit: true, credit: true },
    });

    const totals = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const current = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
      current.debit += Number(line.debit);
      current.credit += Number(line.credit);
      totals.set(line.accountId, current);
    }

    const rows = accounts
      .map((acc) => {
        const t = totals.get(acc.id) ?? { debit: 0, credit: 0 };
        const balance = t.debit - t.credit;
        return {
          accountId: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          debit: t.debit,
          credit: t.credit,
          balance,
        };
      })
      .filter((r) => r.debit > 0 || r.credit > 0);

    return {
      rows,
      totalDebit: rows.reduce((s, r) => s + r.debit, 0),
      totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    };
  }

  buildJournalCsv(entries: Awaited<ReturnType<AccountingReportsService['getJournal']>>) {
    const header = 'Asiento;Fecha;Descripción;Cuenta;Nombre;Debe;Haber';
    const rows: string[] = [header];
    for (const entry of entries) {
      for (const line of entry.lines) {
        rows.push([
          entry.entryNumber,
          entry.entryDate,
          `"${entry.description.replace(/"/g, '""')}"`,
          line.accountCode,
          `"${line.accountName.replace(/"/g, '""')}"`,
          line.debit.toFixed(2),
          line.credit.toFixed(2),
        ].join(';'));
      }
    }
    return `\uFEFF${rows.join('\n')}`;
  }

  private dateRange(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
    if (!from && !to) return undefined;
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    return range;
  }
}
