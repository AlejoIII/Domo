import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { WebhookDispatcherService } from '../../modules/integrations/webhook-dispatcher.service';

const ORDER_STOCK_STATUSES = new Set(['confirmed', 'shipped', 'delivered', 'invoiced']);

export type LineQty = { productId: string | null; quantity: Prisma.Decimal | number };

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export type StockMovementQuery = {
  page?: number;
  limit?: number;
  productId?: string;
  warehouseId?: string;
  type?: string;
  referenceType?: string;
  from?: string;
  to?: string;
  search?: string;
};

interface ApplyMovementOpts {
  companyId: string;
  warehouseId: string;
  productId: string;
  quantityDelta: number;
  type: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  transferGroupId?: string;
  notes?: string;
  createdBy?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhookDispatcherService,
  ) {}

  async resolveWarehouseId(companyId: string, explicitId?: string | null) {
    if (explicitId) {
      const wh = await this.prisma.warehouse.findFirst({
        where: { id: explicitId, companyId, deletedAt: null, isActive: true },
      });
      if (!wh) throw new NotFoundException('Almacén no encontrado');
      return wh.id;
    }

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { defaultWarehouseId: true },
    });

    if (company?.defaultWarehouseId) {
      const wh = await this.prisma.warehouse.findFirst({
        where: {
          id: company.defaultWarehouseId,
          companyId,
          deletedAt: null,
          isActive: true,
        },
      });
      if (wh) return wh.id;
    }

    const fallback = await this.prisma.warehouse.findFirst({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!fallback) {
      throw new BadRequestException(
        'No hay almacén configurado. Crea un almacén antes de mover stock.',
      );
    }

    return fallback.id;
  }

  async onSalesOrderStatusChange(
    companyId: string,
    warehouseId: string | null | undefined,
    previousStatus: string,
    nextStatus: string,
    lines: LineQty[],
    referenceId?: string,
    createdBy?: string,
  ) {
    const wasOut = ORDER_STOCK_STATUSES.has(previousStatus);
    const isOut = ORDER_STOCK_STATUSES.has(nextStatus);
    if (wasOut === isOut) return;

    const whId = await this.resolveWarehouseId(companyId, warehouseId);
    const sign = isOut ? -1 : 1;
    await this.applyLineDeltas({
      companyId,
      warehouseId: whId,
      lines,
      sign,
      type: isOut ? 'out' : 'in',
      referenceType: 'sales_order',
      referenceId,
      createdBy,
    });
  }

  async onPurchaseOrderStatusChange(
    companyId: string,
    warehouseId: string | null | undefined,
    previousStatus: string,
    nextStatus: string,
    lines: LineQty[],
    referenceId?: string,
    createdBy?: string,
  ) {
    const wasIn = previousStatus === 'received';
    const isIn = nextStatus === 'received';
    if (wasIn === isIn) return;

    const whId = await this.resolveWarehouseId(companyId, warehouseId);
    const sign = isIn ? 1 : -1;
    await this.applyLineDeltas({
      companyId,
      warehouseId: whId,
      lines,
      sign,
      type: isIn ? 'in' : 'out',
      referenceType: 'purchase_order',
      referenceId,
      createdBy,
    });
  }

  async onManufacturingComplete(
    companyId: string,
    warehouseId: string | null | undefined,
    finishedProductId: string,
    quantityProduced: number,
    components: LineQty[],
    referenceId: string,
    createdBy?: string,
  ) {
    const whId = await this.resolveWarehouseId(companyId, warehouseId);
    const qty = Math.round(quantityProduced);
    if (qty <= 0) {
      throw new BadRequestException('La cantidad a producir debe ser mayor que cero');
    }

    const scaledLines = components
      .map((line) => ({
        productId: line.productId,
        quantity: Math.round(Number(line.quantity) * qty),
      }))
      .filter((line) => line.quantity > 0);

    if (scaledLines.length > 0) {
      await this.applyLineDeltas({
        companyId,
        warehouseId: whId,
        lines: scaledLines,
        sign: -1,
        type: 'out',
        referenceType: 'manufacturing_order',
        referenceId,
        createdBy,
      });
    }

    await this.applyMovement({
      companyId,
      warehouseId: whId,
      productId: finishedProductId,
      quantityDelta: qty,
      type: 'in',
      referenceType: 'manufacturing_order',
      referenceId,
      notes: 'Producción completada',
      createdBy,
    });
  }

  async onManufacturingRevert(
    companyId: string,
    warehouseId: string | null | undefined,
    finishedProductId: string,
    quantityProduced: number,
    components: LineQty[],
    referenceId: string,
    createdBy?: string,
  ) {
    const whId = await this.resolveWarehouseId(companyId, warehouseId);
    const qty = Math.round(quantityProduced);
    if (qty <= 0) {
      throw new BadRequestException('La cantidad a revertir debe ser mayor que cero');
    }

    await this.applyMovement({
      companyId,
      warehouseId: whId,
      productId: finishedProductId,
      quantityDelta: -qty,
      type: 'out',
      referenceType: 'manufacturing_order_revert',
      referenceId,
      notes: 'Anulación de producción',
      createdBy,
    });

    const scaledLines = components
      .map((line) => ({
        productId: line.productId,
        quantity: Math.round(Number(line.quantity) * qty),
      }))
      .filter((line) => line.quantity > 0);

    if (scaledLines.length > 0) {
      await this.applyLineDeltas({
        companyId,
        warehouseId: whId,
        lines: scaledLines,
        sign: 1,
        type: 'in',
        referenceType: 'manufacturing_order_revert',
        referenceId,
        createdBy,
      });
    }
  }

  async setWarehouseStock(
    companyId: string,
    warehouseId: string,
    productId: string,
    targetQuantity: number,
    notes?: string,
    createdBy?: string,
  ) {
    await this.assertProduct(companyId, productId);
    await this.resolveWarehouseId(companyId, warehouseId);

    const current = await this.getWarehouseQuantity(warehouseId, productId);
    const delta = targetQuantity - current;
    if (delta === 0) {
      return this.getWarehouseStockRow(warehouseId, productId);
    }

    await this.applyMovement({
      companyId,
      warehouseId,
      productId,
      quantityDelta: delta,
      type: 'adjustment',
      referenceType: 'manual',
      notes,
      createdBy,
    });

    return this.getWarehouseStockRow(warehouseId, productId);
  }

  async transferStock(
    companyId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    productId: string,
    quantity: number,
    notes?: string,
    createdBy?: string,
  ) {
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Origen y destino deben ser almacenes distintos');
    }
    if (quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }

    await this.resolveWarehouseId(companyId, fromWarehouseId);
    await this.resolveWarehouseId(companyId, toWarehouseId);
    await this.checkAvailability(companyId, fromWarehouseId, [{ productId, quantity }]);

    const transferGroupId = randomUUID();
    const noteText = notes?.trim() || 'Transferencia entre almacenes';

    await this.applyMovement({
      companyId,
      warehouseId: fromWarehouseId,
      productId,
      quantityDelta: -quantity,
      type: 'transfer',
      referenceType: 'transfer',
      referenceId: transferGroupId,
      transferGroupId,
      notes: noteText,
      createdBy,
    });

    await this.applyMovement({
      companyId,
      warehouseId: toWarehouseId,
      productId,
      quantityDelta: quantity,
      type: 'transfer',
      referenceType: 'transfer',
      referenceId: transferGroupId,
      transferGroupId,
      notes: noteText,
      createdBy,
    });

    return {
      transferGroupId,
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
    };
  }

  async checkAvailability(
    companyId: string,
    warehouseId: string | null | undefined,
    lines: LineQty[],
  ) {
    const whId = await this.resolveWarehouseId(companyId, warehouseId);
    const allowNegative = await this.companyAllowsNegativeStock(companyId);
    if (allowNegative) return;

    const byProduct = this.aggregateLines(lines);
    for (const [productId, qty] of byProduct) {
      const available = await this.getWarehouseQuantity(whId, productId);
      if (available < qty) {
        const product = await this.prisma.product.findFirst({
          where: { id: productId, companyId },
          select: { code: true, name: true },
        });
        throw new BadRequestException(
          `Stock insuficiente para ${product?.code ?? productId} · ${product?.name ?? ''} (disponible: ${available}, requerido: ${qty})`,
        );
      }
    }
  }

  async getProductStockBreakdown(companyId: string, productId: string) {
    await this.assertProduct(companyId, productId);

    const rows = await this.prisma.warehouseStock.findMany({
      where: {
        productId,
        warehouse: { companyId, deletedAt: null, isActive: true },
      },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: { warehouse: { name: 'asc' } },
    });

    const total = rows.reduce((sum, row) => sum + row.quantity, 0);

    return {
      productId,
      total,
      warehouses: rows.map((row) => ({
        warehouseId: row.warehouseId,
        warehouse: row.warehouse,
        quantity: row.quantity,
      })),
    };
  }

  async listMovements(companyId: string, query: StockMovementQuery) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const where = this.buildMovementWhere(companyId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.movementInclude,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async listAllMovements(companyId: string, query: StockMovementQuery, maxRows = 10_000) {
    const where = this.buildMovementWhere(companyId, query);
    return this.prisma.stockMovement.findMany({
      where,
      take: maxRows,
      orderBy: { createdAt: 'desc' },
      include: this.movementInclude,
    });
  }

  async stockValuation(companyId: string, warehouseId?: string) {
    if (warehouseId) {
      await this.resolveWarehouseId(companyId, warehouseId);
    }

    const rows = await this.prisma.warehouseStock.findMany({
      where: {
        quantity: { gt: 0 },
        warehouse: {
          companyId,
          deletedAt: null,
          isActive: true,
          ...(warehouseId ? { id: warehouseId } : {}),
        },
      },
      include: {
        product: { select: { id: true, code: true, name: true, cost: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    const lines = rows.map((row) => {
      const unitCost = Number(row.product.cost ?? 0);
      return {
        warehouseId: row.warehouseId,
        warehouse: row.warehouse,
        productId: row.productId,
        product: row.product,
        quantity: row.quantity,
        unitCost,
        valuation: Math.round(row.quantity * unitCost * 100) / 100,
      };
    });

    const byWarehouseMap = new Map<string, {
      warehouseId: string;
      warehouse: { id: string; code: string; name: string };
      quantity: number;
      value: number;
    }>();

    for (const line of lines) {
      const existing = byWarehouseMap.get(line.warehouseId);
      if (existing) {
        existing.quantity += line.quantity;
        existing.value = Math.round((existing.value + line.valuation) * 100) / 100;
      } else {
        byWarehouseMap.set(line.warehouseId, {
          warehouseId: line.warehouseId,
          warehouse: line.warehouse,
          quantity: line.quantity,
          value: line.valuation,
        });
      }
    }

    const byWarehouse = [...byWarehouseMap.values()].sort(
      (a, b) => a.warehouse.name.localeCompare(b.warehouse.name),
    );

    const totalValue = Math.round(lines.reduce((sum, l) => sum + l.valuation, 0) * 100) / 100;
    const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);

    return {
      summary: {
        totalValue,
        totalUnits,
        lineCount: lines.length,
      },
      byWarehouse,
      lines,
    };
  }

  private readonly movementInclude = {
    product: { select: { id: true, code: true, name: true } },
    warehouse: { select: { id: true, code: true, name: true } },
  } as const;

  private buildMovementWhere(companyId: string, query: StockMovementQuery): Prisma.StockMovementWhereInput {
    const search = query.search?.trim();
    return {
      companyId,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.referenceType ? { referenceType: query.referenceType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to
                ? { lte: (() => {
                  const end = new Date(query.to);
                  end.setHours(23, 59, 59, 999);
                  return end;
                })() }
                : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { notes: { contains: search, mode: 'insensitive' } },
              { product: { code: { contains: search, mode: 'insensitive' } } },
              { product: { name: { contains: search, mode: 'insensitive' } } },
              { warehouse: { code: { contains: search, mode: 'insensitive' } } },
              { warehouse: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
  }

  private async applyLineDeltas(opts: {
    companyId: string;
    warehouseId: string;
    lines: LineQty[];
    sign: number;
    type: StockMovementType;
    referenceType?: string;
    referenceId?: string;
    createdBy?: string;
  }) {
    const byProduct = this.aggregateLines(opts.lines);
    if (byProduct.size === 0) return;

    if (opts.sign < 0) {
      await this.checkAvailability(opts.companyId, opts.warehouseId, opts.lines);
    }

    for (const [productId, qty] of byProduct) {
      await this.applyMovement({
        companyId: opts.companyId,
        warehouseId: opts.warehouseId,
        productId,
        quantityDelta: opts.sign * qty,
        type: opts.type,
        referenceType: opts.referenceType,
        referenceId: opts.referenceId,
        createdBy: opts.createdBy,
      });
    }
  }

  private async applyMovement(opts: ApplyMovementOpts) {
    if (!opts.quantityDelta) return;

    await this.assertProduct(opts.companyId, opts.productId);

    const before = await this.prisma.product.findFirst({
      where: { id: opts.productId, companyId: opts.companyId, deletedAt: null },
      select: { id: true, code: true, name: true, stock: true, minStock: true, unit: true },
    });

    const allowNegative = await this.companyAllowsNegativeStock(opts.companyId);
    const current = await this.getWarehouseQuantity(opts.warehouseId, opts.productId);
    const next = current + opts.quantityDelta;

    if (!allowNegative && next < 0) {
      throw new BadRequestException('Stock insuficiente en el almacén');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: opts.warehouseId,
            productId: opts.productId,
          },
        },
        create: {
          warehouseId: opts.warehouseId,
          productId: opts.productId,
          quantity: Math.max(0, next),
        },
        update: { quantity: next },
      });

      await tx.stockMovement.create({
        data: {
          companyId: opts.companyId,
          warehouseId: opts.warehouseId,
          productId: opts.productId,
          type: opts.type,
          quantity: opts.quantityDelta,
          referenceType: opts.referenceType,
          referenceId: opts.referenceId,
          transferGroupId: opts.transferGroupId,
          notes: opts.notes,
          createdBy: opts.createdBy,
        },
      });

      await this.syncProductStockTx(tx, opts.companyId, opts.productId);
    });

    if (before && before.minStock > 0) {
      const after = await this.prisma.product.findFirst({
        where: { id: opts.productId, companyId: opts.companyId, deletedAt: null },
        select: { stock: true, minStock: true },
      });
      if (after) {
        const wasAbove = before.stock > before.minStock;
        const isLow = after.stock <= after.minStock;
        if (wasAbove && isLow) {
          this.webhooks.emit(opts.companyId, 'stock.low', {
            productId: before.id,
            code: before.code,
            name: before.name,
            stock: after.stock,
            minStock: after.minStock,
            unit: before.unit,
          });
        }
      }
    }
  }

  private async syncProductStockTx(
    tx: Prisma.TransactionClient,
    companyId: string,
    productId: string,
  ) {
    const rows = await tx.warehouseStock.findMany({
      where: {
        productId,
        warehouse: { companyId, deletedAt: null, isActive: true },
      },
      select: { quantity: true },
    });
    const total = rows.reduce((sum, row) => sum + row.quantity, 0);
    await tx.product.updateMany({
      where: { id: productId, companyId, deletedAt: null },
      data: { stock: total },
    });
  }

  private aggregateLines(lines: LineQty[]) {
    const byProduct = new Map<string, number>();
    for (const line of lines) {
      if (!line.productId) continue;
      const qty = Math.round(Number(line.quantity));
      if (!qty) continue;
      byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + qty);
    }
    return byProduct;
  }

  private async getWarehouseQuantity(warehouseId: string, productId: string) {
    const row = await this.prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    return row?.quantity ?? 0;
  }

  private async getWarehouseStockRow(warehouseId: string, productId: string) {
    return this.prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
      include: { product: { select: { id: true, code: true, name: true } } },
    });
  }

  private async assertProduct(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
  }

  private async companyAllowsNegativeStock(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { allowNegativeStock: true },
    });
    return company?.allowNegativeStock ?? false;
  }
}
