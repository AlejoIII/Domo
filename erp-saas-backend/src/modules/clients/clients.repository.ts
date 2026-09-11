import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { computeInvoiceBalances } from '../invoices/invoice.mapper';

export type ClientListItem = Prisma.ClientGetPayload<object> & {
  totalBilled?: number;
  outstanding?: number;
};

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(companyId: string, query: QueryClientsDto): Prisma.ClientWhereInput {
    return {
      companyId,
      deletedAt: null,
      ...(query.segment ? { segment: query.segment } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { taxId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  async findMany(companyId: string, query: QueryClientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, query);
    const sortBy = query.sortBy ?? 'createdAt';

    if (sortBy === 'billing') {
      const matching = await this.prisma.client.findMany({
        where,
        select: { id: true },
      });
      const statsMap = await this.loadBillingStats(
        companyId,
        matching.map((c) => c.id),
      );
      const sortedIds = matching
        .map((c) => c.id)
        .sort((a, b) => (statsMap.get(b)?.totalBilled ?? 0) - (statsMap.get(a)?.totalBilled ?? 0));
      const pageIds = sortedIds.slice(skip, skip + limit);
      const itemsRaw = pageIds.length
        ? await this.prisma.client.findMany({ where: { id: { in: pageIds } } })
        : [];
      const items = pageIds
        .map((id) => itemsRaw.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((client) => ({
          ...client,
          totalBilled: statsMap.get(client.id)?.totalBilled ?? 0,
          outstanding: statsMap.get(client.id)?.outstanding ?? 0,
        }));

      return [items, matching.length] as const;
    }

    const orderBy =
      sortBy === 'name'
        ? { name: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [itemsRaw, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.client.count({ where }),
    ]);

    const statsMap = await this.loadBillingStats(
      companyId,
      itemsRaw.map((c) => c.id),
    );
    const items = itemsRaw.map((client) => ({
      ...client,
      totalBilled: statsMap.get(client.id)?.totalBilled ?? 0,
      outstanding: statsMap.get(client.id)?.outstanding ?? 0,
    }));

    return [items, total] as const;
  }

  findById(id: string, companyId: string) {
    return this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  create(companyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, companyId },
    });
  }

  update(id: string, companyId: string, dto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  softDelete(id: string, companyId: string) {
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async loadBillingStats(companyId: string, clientIds: string[]) {
    const map = new Map<string, { totalBilled: number; outstanding: number }>();
    if (clientIds.length === 0) return map;

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        clientId: { in: clientIds },
        deletedAt: null,
        status: { notIn: ['draft', 'cancelled'] },
      },
      include: {
        payments: true,
        creditNotes: {
          where: { deletedAt: null },
          select: { total: true, status: true },
        },
      },
    });

    for (const invoice of invoices) {
      const stats = map.get(invoice.clientId) ?? { totalBilled: 0, outstanding: 0 };
      // Las rectificativas minoran la facturación acumulada del cliente
      const sign = invoice.documentType === 'credit_note' ? -1 : 1;
      stats.totalBilled += sign * Number(invoice.total);
      if (['issued', 'partially_paid'].includes(invoice.status) && sign === 1) {
        stats.outstanding += computeInvoiceBalances(
          invoice,
          invoice.payments,
          invoice.creditNotes,
        ).balanceDue;
      }
      map.set(invoice.clientId, stats);
    }

    for (const [id, stats] of map) {
      map.set(id, {
        totalBilled: Math.round(stats.totalBilled * 100) / 100,
        outstanding: Math.round(stats.outstanding * 100) / 100,
      });
    }

    return map;
  }

  listNotes(clientId: string, companyId: string) {
    return this.prisma.clientNote.findMany({
      where: { clientId, companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  createNote(clientId: string, companyId: string, text: string, userId?: string) {
    return this.prisma.clientNote.create({
      data: { clientId, companyId, text, userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  deleteNote(noteId: string, companyId: string) {
    return this.prisma.clientNote.deleteMany({
      where: { id: noteId, companyId },
    });
  }
}
