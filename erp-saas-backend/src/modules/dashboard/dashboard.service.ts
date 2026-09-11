import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { InjectReadPrisma } from '../../common/database/prisma-read.service';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { computeInvoiceBalances } from '../invoices/invoice.mapper';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class DashboardService {
  private readonly cacheTtl: number;

  constructor(
    @InjectReadPrisma() private readonly prisma: PrismaClient,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.cacheTtl = Number(config.get<string>('CACHE_DASHBOARD_TTL_SEC', '60'));
  }

  getStats(companyId: string) {
    return this.cache.getOrSet(
      CacheKeys.dashboardStats(companyId),
      () => this.computeStats(companyId),
      this.cacheTtl,
    );
  }

  private async computeStats(companyId: string) {
    const base = { companyId, deletedAt: null };
    const today = startOfToday();
    const { start: monthStart, end: monthEnd } = currentMonthRange();

    const [
      company,
      clients,
      products,
      employees,
      suppliers,
      orders,
      invoices,
      quotes,
      purchaseOrders,
      revenueAgg,
      recentOrders,
      lowStockProducts,
      lowStockCount,
      openInvoices,
      ordersToShip,
      monthlySalesAgg,
      chart,
    ] = await Promise.all([
      this.prisma.company.findFirst({
        where: { id: companyId, deletedAt: null },
        select: { monthlySalesTarget: true },
      }),
      this.prisma.client.count({ where: base }),
      this.prisma.product.count({ where: base }),
      this.prisma.employee.count({ where: base }),
      this.prisma.supplier.count({ where: base }),
      this.prisma.salesOrder.count({ where: base }),
      this.prisma.invoice.count({ where: base }),
      this.prisma.quote.count({ where: base }),
      this.prisma.purchaseOrder.count({ where: base }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          deletedAt: null,
          status: { in: ['paid', 'issued', 'partially_paid'] },
        },
        _sum: { total: true },
      }),
      this.prisma.salesOrder.findMany({
        where: base,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
          createdAt: true,
          client: { select: { name: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { companyId, deletedAt: null, minStock: { gt: 0 }, isActive: true },
        orderBy: { stock: 'asc' },
        take: 50,
        select: {
          id: true,
          code: true,
          name: true,
          stock: true,
          minStock: true,
          unit: true,
        },
      }),
      this.prisma.product.findMany({
        where: { companyId, deletedAt: null, minStock: { gt: 0 }, isActive: true },
        select: { stock: true, minStock: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...base,
          documentType: 'invoice',
          status: { in: ['issued', 'partially_paid'] },
        },
        select: {
          total: true,
          dueDate: true,
          status: true,
          payments: { select: { amount: true } },
          creditNotes: {
            where: { deletedAt: null },
            select: { total: true, status: true },
          },
        },
      }),
      this.prisma.salesOrder.count({
        where: { ...base, status: 'confirmed' },
      }),
      this.prisma.salesOrder.aggregate({
        where: {
          companyId,
          deletedAt: null,
          status: { not: 'cancelled' },
          orderDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { total: true },
      }),
      this.getMonthlyChart(companyId),
    ]);

    const lowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);
    let outstandingReceivable = 0;
    let overdueInvoicesCount = 0;
    let overdueInvoicesAmount = 0;

    for (const inv of openInvoices) {
      const { balanceDue } = computeInvoiceBalances(inv, inv.payments, inv.creditNotes);
      outstandingReceivable += balanceDue;
      if (inv.dueDate && new Date(inv.dueDate) < today && balanceDue > 0) {
        overdueInvoicesCount += 1;
        overdueInvoicesAmount += balanceDue;
      }
    }

    const monthlySales = Number(monthlySalesAgg._sum.total ?? 0);
    const monthlySalesTarget = company?.monthlySalesTarget != null
      ? Number(company.monthlySalesTarget)
      : null;
    const monthlySalesProgress = monthlySalesTarget != null && monthlySalesTarget > 0
      ? Math.round((monthlySales / monthlySalesTarget) * 1000) / 10
      : null;

    return {
      clients,
      products,
      employees,
      suppliers,
      orders,
      invoices,
      quotes,
      purchaseOrders,
      revenue: Number(revenueAgg._sum.total ?? 0),
      outstandingReceivable: Math.round(outstandingReceivable * 100) / 100,
      overdueInvoicesCount,
      overdueInvoicesAmount: Math.round(overdueInvoicesAmount * 100) / 100,
      ordersToShip,
      monthlySales: Math.round(monthlySales * 100) / 100,
      monthlySalesTarget,
      monthlySalesProgress,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        total: Number(o.total),
        status: o.status,
        client: o.client,
        createdAt: o.createdAt,
      })),
      lowStockCount: lowStockCount.filter((p) => p.stock <= p.minStock).length,
      lowStockProducts: lowStock.slice(0, 8).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
      })),
      chart,
    };
  }

  private async getMonthlyChart(companyId: string) {
    const months = 6;
    const now = new Date();
    const points = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [salesAgg, paymentsAgg] = await Promise.all([
        this.prisma.salesOrder.aggregate({
          where: {
            companyId,
            deletedAt: null,
            status: { not: 'cancelled' },
            orderDate: { gte: start, lte: end },
          },
          _sum: { total: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            companyId,
            paymentDate: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
      ]);

      points.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        label: start.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        sales: Number(salesAgg._sum.total ?? 0),
        collections: Number(paymentsAgg._sum.amount ?? 0),
      });
    }

    return points;
  }
}
