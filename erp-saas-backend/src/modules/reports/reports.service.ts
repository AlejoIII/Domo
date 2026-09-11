import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { InjectReadPrisma } from '../../common/database/prisma-read.service';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { ExportStoreService } from '../../common/queue/export-store.service';
import { QueueService } from '../../common/queue/queue.service';
import { ReportPeriodDto } from './dto/report-period.dto';
import { ReportExportQueryDto } from './dto/report-export.dto';
import { computeInvoiceBalances } from '../invoices/invoice.mapper';
import { round2 } from '../../common/utils/document-totals';

function periodFilter(field: string, query: ReportPeriodDto): Record<string, unknown> | undefined {
  if (!query.from && !query.to) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (query.from) range.gte = new Date(query.from);
  if (query.to) {
    const end = new Date(query.to);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return { [field]: range };
}

function num(v: Prisma.Decimal | number | null | undefined) {
  return Number(v ?? 0);
}

@Injectable()
export class ReportsService {
  private readonly reportsTtl: number;

  constructor(
    @InjectReadPrisma() private readonly prisma: PrismaClient,
    private readonly cache: CacheService,
    private readonly queue: QueueService,
    private readonly exportStore: ExportStoreService,
    config: ConfigService,
  ) {
    this.reportsTtl = Number(config.get<string>('CACHE_REPORTS_TTL_SEC', '120'));
  }

  async getExportContext(companyId: string, from?: string, to?: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { name: true },
    });
    return {
      companyName: company?.name ?? 'Empresa',
      from,
      to,
      generatedAt: new Date(),
    };
  }

  sales(companyId: string, query: ReportPeriodDto) {
    const cacheKey = CacheKeys.reportsSales(companyId, query.from, query.to);
    return this.cache.getOrSet(cacheKey, () => this.computeSales(companyId, query), this.reportsTtl);
  }

  private async computeSales(companyId: string, query: ReportPeriodDto) {
    const dateFilter = periodFilter('orderDate', query);
    const quoteDateFilter = periodFilter('quoteDate', query);
    const base = { companyId, deletedAt: null };

    const orderWhere = { ...base, ...(dateFilter ?? {}) };
    const quoteWhere = { ...base, ...(quoteDateFilter ?? {}) };

    const [ordersCount, ordersTotalAgg, quotes, byStatusRaw, topClientsRaw, recentOrders] =
      await Promise.all([
        this.prisma.salesOrder.count({ where: orderWhere }),
        this.prisma.salesOrder.aggregate({
          where: orderWhere,
          _sum: { total: true },
        }),
        this.prisma.quote.findMany({
          where: quoteWhere,
          select: { id: true, status: true, total: true },
        }),
        this.prisma.salesOrder.groupBy({
          by: ['status'],
          where: orderWhere,
          _count: { _all: true },
          _sum: { total: true },
        }),
        this.prisma.salesOrder.groupBy({
          by: ['clientId'],
          where: orderWhere,
          _count: { _all: true },
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 10,
        }),
        this.prisma.salesOrder.findMany({
          where: orderWhere,
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            orderDate: true,
            client: { select: { id: true, name: true } },
          },
          orderBy: { orderDate: 'desc' },
          take: 20,
        }),
      ]);

    const clientIds = topClientsRaw.map((r) => r.clientId);
    const clients = clientIds.length
      ? await this.prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true },
        })
      : [];
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const quoteTotal = quotes.reduce((s, q) => s + num(q.total), 0);
    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');

    return {
      summary: {
        ordersCount,
        ordersTotal: num(ordersTotalAgg._sum.total),
        quotesCount: quotes.length,
        quotesTotal: quoteTotal,
        acceptedQuotes: acceptedQuotes.length,
        conversionRate:
          quotes.length > 0
            ? Math.round((acceptedQuotes.length / quotes.length) * 1000) / 10
            : 0,
      },
      byStatus: byStatusRaw.map((r) => ({
        status: r.status,
        count: r._count._all,
        total: num(r._sum.total),
      })),
      topClients: topClientsRaw.map((r) => ({
        clientId: r.clientId,
        clientName: clientMap.get(r.clientId) ?? '—',
        orders: r._count._all,
        total: num(r._sum.total),
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: num(o.total),
        orderDate: o.orderDate,
        client: o.client,
      })),
    };
  }

  async finance(companyId: string, query: ReportPeriodDto) {
    const invoiceDate = periodFilter('issueDate', query);
    const paymentDate = periodFilter('paymentDate', query);
    const poDate = periodFilter('orderDate', query);
    const base = { companyId, deletedAt: null };

    const invoiceWhere = { ...base, ...(invoiceDate ?? {}) };
    const paymentWhere = { companyId, ...(paymentDate ?? {}) };
    const poWhere = { ...base, ...(poDate ?? {}) };

    const [
      invoiceByStatus,
      invoices,
      openInvoices,
      purchaseOrders,
      poByStatus,
      paymentsInPeriod,
    ] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status', 'documentType'],
        where: invoiceWhere,
        _count: { _all: true },
        _sum: { total: true, taxAmount: true, subtotal: true },
      }),
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          payments: true,
          client: { select: { id: true, name: true } },
          creditNotes: {
            where: { deletedAt: null },
            select: { total: true, status: true },
          },
        },
        orderBy: { issueDate: 'desc' },
        take: 20,
      }),
      this.prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          documentType: 'invoice',
          status: { in: ['issued', 'partially_paid'] },
        },
        select: {
          total: true,
          status: true,
          dueDate: true,
          payments: { select: { amount: true } },
          creditNotes: {
            where: { deletedAt: null },
            select: { total: true, status: true },
          },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: poWhere,
        select: { id: true, status: true, total: true },
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: poWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.payment.findMany({
        where: paymentWhere,
        select: { amount: true },
      }),
    ]);

    const draft = invoiceByStatus.find(
      (s) => s.status === 'draft' && s.documentType === 'invoice',
    );

    const effective = invoiceByStatus.filter(
      (s) => s.status !== 'draft' && s.status !== 'cancelled',
    );
    const sumBy = (
      documentType: string,
      field: 'total' | 'taxAmount',
    ) => effective
      .filter((s) => s.documentType === documentType)
      .reduce((sum, s) => sum + num(s._sum[field]), 0);

    // Las rectificativas minoran facturación e IVA repercutido del periodo
    const credited = sumBy('credit_note', 'total');
    const billed = round2(sumBy('invoice', 'total') - credited);
    const taxCollected = round2(
      sumBy('invoice', 'taxAmount') - sumBy('credit_note', 'taxAmount'),
    );

    const collected = paymentsInPeriod.reduce((s, p) => s + num(p.amount), 0);

    const outstanding = round2(
      openInvoices.reduce((s, inv) => {
        const { balanceDue } = computeInvoiceBalances(inv, inv.payments, inv.creditNotes);
        return s + balanceDue;
      }, 0),
    );

    const purchasesTotal = purchaseOrders.reduce((s, p) => s + num(p.total), 0);
    const purchasesReceived = purchaseOrders
      .filter((p) => p.status === 'received')
      .reduce((s, p) => s + num(p.total), 0);

    return {
      summary: {
        billed,
        credited,
        collected,
        outstanding,
        draftTotal: num(draft?._sum.total),
        taxCollected,
        purchasesTotal,
        purchasesReceived,
        margin: round2(billed - purchasesReceived),
      },
      invoicesByStatus: invoiceByStatus.map((r) => ({
        status: r.status,
        documentType: r.documentType,
        count: r._count._all,
        total: num(r._sum.total),
        tax: num(r._sum.taxAmount),
        subtotal: num(r._sum.subtotal),
      })),
      purchasesByStatus: poByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        total: num(r._sum.total),
      })),
      recentInvoices: invoices.map((inv) => {
        const { paidAmount, balanceDue, isOverdue } = computeInvoiceBalances(
          inv,
          inv.payments,
          inv.creditNotes,
        );
        return {
          id: inv.id,
          number: inv.number,
          status: inv.status,
          documentType: inv.documentType,
          total: num(inv.total),
          taxAmount: num(inv.taxAmount),
          paidAmount,
          balanceDue,
          isOverdue,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          client: inv.client,
        };
      }),
    };
  }

  async enqueueSalesExport(companyId: string, query: ReportExportQueryDto) {
    return this.enqueueExport(companyId, 'sales', query);
  }

  async enqueueFinanceExport(companyId: string, query: ReportExportQueryDto) {
    return this.enqueueExport(companyId, 'finance', query);
  }

  async getExportStatus(jobId: string, companyId: string) {
    const meta = await this.exportStore.getMeta(jobId, companyId);
    if (!meta) throw new NotFoundException('Exportación no encontrada');
    return {
      jobId: meta.jobId,
      status: meta.status,
      reportType: meta.reportType,
      format: meta.format,
      fileName: meta.fileName,
      error: meta.error,
      createdAt: meta.createdAt,
      completedAt: meta.completedAt,
      downloadUrl:
        meta.status === 'completed'
          ? `/api/v1/reports/exports/${meta.jobId}/download`
          : undefined,
    };
  }

  async readExportFile(jobId: string, companyId: string) {
    const meta = await this.exportStore.getMeta(jobId, companyId);
    if (!meta || meta.status !== 'completed') {
      throw new NotFoundException('Exportación no disponible');
    }
    const ext = meta.format;
    const content = await this.exportStore.readFile(companyId, jobId, ext);
    return { meta, content };
  }

  private async enqueueExport(
    companyId: string,
    reportType: 'sales' | 'finance',
    query: ReportExportQueryDto,
  ) {
    const format = query.format ?? 'csv';
    const jobId = this.exportStore.buildJobId(companyId, reportType, {
      from: query.from,
      to: query.to,
      format,
    });

    const existing = await this.exportStore.getMeta(jobId, companyId);
    if (existing?.status === 'completed') {
      return {
        jobId,
        status: existing.status,
        message: 'Exportación ya disponible',
        downloadUrl: `/api/v1/reports/exports/${jobId}/download`,
      };
    }
    if (existing?.status === 'queued' || existing?.status === 'processing') {
      return {
        jobId,
        status: existing.status,
        message: 'Exportación en curso',
        pollUrl: `/api/v1/reports/exports/${jobId}`,
      };
    }

    await this.exportStore.createQueued({
      jobId,
      companyId,
      reportType,
      format,
    });

    this.queue.enqueueExport(
      {
        jobId,
        companyId,
        reportType,
        format,
        query: { from: query.from, to: query.to },
      },
      jobId,
    );

    return {
      jobId,
      status: 'queued' as const,
      message: 'Exportación encolada',
      pollUrl: `/api/v1/reports/exports/${jobId}`,
    };
  }
}
