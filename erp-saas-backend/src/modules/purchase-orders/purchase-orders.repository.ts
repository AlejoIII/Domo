import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DocumentNumberService } from '../../common/documents/document-number.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { QueryPurchaseOrdersDto } from './dto/query-purchase-orders.dto';
import { calcLines } from '../../common/utils/document-totals';
import { parseDateRange } from '../../common/utils/date-range-filter';

const poInclude = {
  supplier: { select: { id: true, name: true } },
  lines: true,
} as const;

@Injectable()
export class PurchaseOrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docNumbers: DocumentNumberService,
  ) {}

  findMany(companyId: string, query: QueryPurchaseOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const orderDateRange = parseDateRange(query.from, query.to);

    const where = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(orderDateRange ? { orderDate: orderDateRange } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' as const } },
              { notes: { contains: query.search, mode: 'insensitive' as const } },
              { supplier: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: poInclude,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: poInclude,
    });
  }

  async create(companyId: string, dto: CreatePurchaseOrderDto) {
    const taxRate = dto.taxRate ?? 21;
    const totals = calcLines(dto.lines, taxRate);
    const number = dto.number ?? await this.docNumbers.nextNumber(companyId, 'purchase_order');

    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        number,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        status: dto.status ?? 'draft',
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
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
      include: poInclude,
    });
  }

  async update(id: string, companyId: string, dto: UpdatePurchaseOrderDto) {
    const existing = await this.findById(id, companyId);
    if (!existing) return null;

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const data: Record<string, unknown> = {
      ...(dto.number !== undefined ? { number: dto.number } : {}),
      ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
      ...(dto.warehouseId !== undefined ? { warehouseId: dto.warehouseId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.orderDate !== undefined ? { orderDate: new Date(dto.orderDate) } : {}),
      ...(dto.expectedDate !== undefined ? { expectedDate: new Date(dto.expectedDate) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };

    if (dto.lines) {
      const totals = calcLines(dto.lines, taxRate);
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;

      return this.prisma.$transaction(async (tx) => {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
        return tx.purchaseOrder.update({
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
          include: poInclude,
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

    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: poInclude,
    });
  }

  softDelete(id: string) {
    return this.prisma.purchaseOrder.update({
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
      supplierId: source.supplierId,
      warehouseId: source.warehouseId ?? undefined,
      status: 'draft',
      taxRate: Number(source.taxRate),
      notes,
      expectedDate: source.expectedDate?.toISOString(),
      lines: source.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
  }
}
