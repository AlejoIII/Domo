import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(companyId: string, query: QueryClientsDto) {
    const [items, total] = await this.repo.findMany(companyId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const client = await this.repo.findById(id, companyId);
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  create(companyId: string, dto: CreateClientDto) {
    return this.repo.create(companyId, dto);
  }

  async update(id: string, companyId: string, dto: UpdateClientDto) {
    await this.findOne(id, companyId);
    return this.repo.update(id, companyId, dto);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id, companyId);
    return { message: 'Cliente eliminado' };
  }

  async getSummary(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const statsMap = await this.repo.loadBillingStats(companyId, [id]);
    const stats = statsMap.get(id) ?? { totalBilled: 0, outstanding: 0 };

    const [ordersCount, quotesCount, lastOrder] = await Promise.all([
      this.prisma.salesOrder.count({
        where: { clientId: id, companyId, deletedAt: null },
      }),
      this.prisma.quote.count({
        where: { clientId: id, companyId, deletedAt: null },
      }),
      this.prisma.salesOrder.findFirst({
        where: { clientId: id, companyId, deletedAt: null },
        orderBy: { orderDate: 'desc' },
        select: {
          id: true,
          number: true,
          orderDate: true,
          total: true,
          status: true,
        },
      }),
    ]);

    return {
      totalBilled: stats.totalBilled,
      outstanding: stats.outstanding,
      ordersCount,
      quotesCount,
      lastOrder: lastOrder
        ? {
            id: lastOrder.id,
            number: lastOrder.number,
            orderDate: lastOrder.orderDate.toISOString(),
            total: Number(lastOrder.total),
            status: lastOrder.status,
          }
        : null,
    };
  }

  async getTimeline(id: string, companyId: string, limit = 50) {
    await this.findOne(id, companyId);

    const [orders, invoices, notes] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { clientId: id, companyId, deletedAt: null },
        select: {
          id: true,
          number: true,
          orderDate: true,
          total: true,
          status: true,
        },
        orderBy: { orderDate: 'desc' },
        take: limit,
      }),
      this.prisma.invoice.findMany({
        where: { clientId: id, companyId, deletedAt: null },
        include: { payments: true },
        orderBy: { issueDate: 'desc' },
        take: limit,
      }),
      this.repo.listNotes(id, companyId),
    ]);

    type TimelineItem = {
      type: string;
      id: string;
      date: string;
      title: string;
      subtitle?: string;
      amount?: number;
    };

    const items: TimelineItem[] = [];

    for (const order of orders) {
      items.push({
        type: 'order',
        id: order.id,
        date: order.orderDate.toISOString(),
        title: `Pedido ${order.number}`,
        subtitle: order.status,
        amount: Number(order.total),
      });
    }

    for (const invoice of invoices) {
      items.push({
        type: 'invoice',
        id: invoice.id,
        date: invoice.issueDate.toISOString(),
        title: `Factura ${invoice.number}`,
        subtitle: invoice.status,
        amount: Number(invoice.total),
      });

      for (const payment of invoice.payments) {
        items.push({
          type: 'payment',
          id: payment.id,
          date: payment.paymentDate.toISOString(),
          title: `Pago factura ${invoice.number}`,
          subtitle: payment.method ?? undefined,
          amount: Number(payment.amount),
        });
      }
    }

    for (const note of notes) {
      const author = note.user
        ? [note.user.firstName, note.user.lastName].filter(Boolean).join(' ') || note.user.email
        : undefined;
      items.push({
        type: 'note',
        id: note.id,
        date: note.createdAt.toISOString(),
        title: 'Nota CRM',
        subtitle: author ? `${author}: ${note.text.slice(0, 80)}` : note.text.slice(0, 120),
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { items: items.slice(0, limit) };
  }

  listNotes(id: string, companyId: string) {
    return this.repo.listNotes(id, companyId).then((notes) =>
      notes.map((note) => ({
        id: note.id,
        text: note.text,
        createdAt: note.createdAt.toISOString(),
        user: note.user,
      })),
    );
  }

  async createNote(id: string, companyId: string, text: string, userId?: string) {
    await this.findOne(id, companyId);
    const note = await this.repo.createNote(id, companyId, text, userId);
    return {
      id: note.id,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      user: note.user,
    };
  }

  async removeNote(clientId: string, noteId: string, companyId: string) {
    await this.findOne(clientId, companyId);
    const result = await this.repo.deleteNote(noteId, companyId);
    if (result.count === 0) throw new NotFoundException('Nota no encontrada');
    return { message: 'Nota eliminada' };
  }
}
