import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { computeInvoiceBalances } from '../invoices/invoice.mapper';
export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface AppAlert {
  id: string;
  type: 'low_stock' | 'invoice_overdue' | 'order_pending_ship';
  category: 'system' | 'invoices' | 'orders';
  severity: AlertSeverity;
  title: string;
  message: string;
  link: string;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlerts(companyId: string) {
    const now = new Date();
    const base = { companyId, deletedAt: null };

    const [lowStockProducts, overdueInvoices, pendingShipOrders] = await Promise.all([
      this.prisma.product.findMany({
        where: { ...base, minStock: { gt: 0 }, isActive: true },
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
      this.prisma.invoice.findMany({
        where: {
          ...base,
          documentType: 'invoice',
          status: { in: ['issued', 'partially_paid'] },
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
        select: {
          id: true,
          number: true,
          total: true,
          dueDate: true,
          status: true,
          client: { select: { name: true } },
          payments: { select: { amount: true } },
          creditNotes: {
            where: { deletedAt: null },
            select: { total: true, status: true },
          },
        },
      }),
      this.prisma.salesOrder.findMany({
        where: { ...base, status: 'confirmed' },
        orderBy: { orderDate: 'asc' },
        take: 10,
        select: {
          id: true,
          number: true,
          orderDate: true,
          client: { select: { name: true } },
        },
      }),
    ]);

    const alerts: AppAlert[] = [];

    for (const p of lowStockProducts.filter((item) => item.stock <= item.minStock)) {
      alerts.push({
        id: `low_stock_${p.id}`,
        type: 'low_stock',
        category: 'system',
        severity: p.stock === 0 ? 'danger' : 'warning',
        title: p.stock === 0 ? 'Sin stock' : 'Stock bajo',
        message: `${p.code} · ${p.name}: ${p.stock}/${p.minStock} ${p.unit}`,
        link: `/products/${p.id}`,
        createdAt: now,
      });
    }

    for (const inv of overdueInvoices) {
      const { balanceDue, isOverdue } = computeInvoiceBalances(inv, inv.payments, inv.creditNotes);
      if (!isOverdue || balanceDue <= 0) continue;

      alerts.push({
        id: `invoice_overdue_${inv.id}`,
        type: 'invoice_overdue',
        category: 'invoices',
        severity: 'warning',
        title: 'Factura vencida',
        message: `${inv.number} · ${inv.client?.name ?? 'Cliente'} · pendiente ${balanceDue.toFixed(2)} € · venció ${inv.dueDate?.toLocaleDateString('es-ES') ?? ''}`,
        link: `/invoices/${inv.id}`,
        createdAt: inv.dueDate ?? now,
      });
    }

    for (const order of pendingShipOrders) {
      alerts.push({
        id: `order_ship_${order.id}`,
        type: 'order_pending_ship',
        category: 'orders',
        severity: 'info',
        title: 'Pedido pendiente de envío',
        message: `${order.number} · ${order.client?.name ?? 'Cliente'}`,
        link: `/orders/${order.id}`,
        createdAt: order.orderDate,
      });
    }

    alerts.sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
      alerts: alerts.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      counts: {
        total: alerts.length,
        system: alerts.filter((a) => a.category === 'system').length,
        invoices: alerts.filter((a) => a.category === 'invoices').length,
        orders: alerts.filter((a) => a.category === 'orders').length,
      },
    };
  }
}
