import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DocumentNumberService } from '../../common/documents/document-number.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { calcLines } from '../../common/utils/document-totals';
import { parseDateRange } from '../../common/utils/date-range-filter';

const orderInclude = {
  client: { select: { id: true, name: true } },
  lines: true,
} as const;

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docNumbers: DocumentNumberService,
  ) {}

  findMany(companyId: string, query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const orderDateRange = parseDateRange(query.from, query.to);

    const where = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(orderDateRange ? { orderDate: orderDateRange } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' as const } },
              { notes: { contains: query.search, mode: 'insensitive' as const } },
              { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.salesOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: orderInclude,
    });
  }

  async create(companyId: string, dto: CreateOrderDto) {
    const taxRate = dto.taxRate ?? 21;
    const totals = calcLines(dto.lines, taxRate);
    const number = dto.number ?? await this.docNumbers.nextNumber(companyId, 'order');
    const status = dto.status ?? 'draft';
    const deliveryNoteNumber =
      status === 'delivered' ? await this.docNumbers.nextNumber(companyId, 'delivery_note') : undefined;

    return this.prisma.salesOrder.create({
      data: {
        companyId,
        number,
        clientId: dto.clientId,
        warehouseId: dto.warehouseId,
        status,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        notes: dto.notes,
        shippedAt: dto.shippedAt ? new Date(dto.shippedAt) : undefined,
        deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
        trackingNumber: dto.trackingNumber,
        deliveryNotes: dto.deliveryNotes,
        deliveryAddress: dto.deliveryAddress,
        deliveryNoteNumber,
        taxRate: totals.taxRate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        lines: {
          create: totals.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
      },
      include: orderInclude,
    });
  }

  async update(id: string, companyId: string, dto: UpdateOrderDto) {
    const existing = await this.findById(id, companyId);
    if (!existing) return null;

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const data: Record<string, unknown> = {
      ...(dto.number !== undefined ? { number: dto.number } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.warehouseId !== undefined ? { warehouseId: dto.warehouseId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.orderDate !== undefined ? { orderDate: new Date(dto.orderDate) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.shippedAt !== undefined ? { shippedAt: new Date(dto.shippedAt) } : {}),
      ...(dto.deliveredAt !== undefined ? { deliveredAt: new Date(dto.deliveredAt) } : {}),
      ...(dto.trackingNumber !== undefined ? { trackingNumber: dto.trackingNumber } : {}),
      ...(dto.deliveryNotes !== undefined ? { deliveryNotes: dto.deliveryNotes } : {}),
      ...(dto.deliveryAddress !== undefined ? { deliveryAddress: dto.deliveryAddress } : {}),
    };

    if (dto.status && dto.status !== existing.status) {
      if (dto.status === 'shipped' && dto.shippedAt === undefined) {
        data.shippedAt = new Date();
      }
      if (dto.status === 'delivered') {
        if (dto.deliveredAt === undefined) {
          data.deliveredAt = new Date();
        }
        if (!data.shippedAt && !existing.shippedAt) data.shippedAt = new Date();
        if (!existing.deliveryNoteNumber) {
          data.deliveryNoteNumber = await this.docNumbers.nextNumber(companyId, 'delivery_note');
        }
      }
    }

    if (dto.lines) {
      const totals = calcLines(dto.lines, taxRate);
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;

      return this.prisma.$transaction(async (tx) => {
        await tx.salesOrderLine.deleteMany({ where: { orderId: id } });
        return tx.salesOrder.update({
          where: { id },
          data: {
            ...data,
            lines: {
              create: totals.lines.map((line) => ({
                productId: line.productId,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineTotal: line.lineTotal,
              })),
            },
          },
          include: orderInclude,
        });
      });
    }

    if (dto.taxRate !== undefined && !dto.lines) {
      const totals = calcLines(
        existing.lines.map((l) => ({
          productId: l.productId ?? undefined,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        taxRate,
      );
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data,
      include: orderInclude,
    });
  }

  softDelete(id: string) {
    return this.prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, companyId: string) {
    const source = await this.findById(id, companyId);
    if (!source) return null;

    const noteSuffix = `(Copia de ${source.number})`;
    const notes = source.notes ? `${source.notes}\n${noteSuffix}` : noteSuffix;

    return this.create(companyId, {
      clientId: source.clientId,
      warehouseId: source.warehouseId ?? undefined,
      status: 'draft',
      taxRate: Number(source.taxRate),
      notes,
      deliveryAddress: source.deliveryAddress ?? undefined,
      lines: source.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
  }
}
