import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { InventoryService } from '../../common/inventory/inventory.service';
import { CreateBomDto, QueryBomsDto, UpdateBomDto } from './dto/bom.dto';
import {
  CreateManufacturingOrderDto,
  QueryManufacturingOrdersDto,
  UpdateManufacturingOrderDto,
} from './dto/manufacturing-order.dto';

const bomInclude = {
  product: { select: { id: true, code: true, name: true, unit: true } },
  lines: {
    orderBy: { lineOrder: 'asc' as const },
    include: {
      component: { select: { id: true, code: true, name: true, unit: true } },
    },
  },
} as const;

const orderInclude = {
  product: { select: { id: true, code: true, name: true, unit: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  bom: {
    include: {
      lines: {
        orderBy: { lineOrder: 'asc' as const },
        include: {
          component: { select: { id: true, code: true, name: true, unit: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class ManufacturingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async findAllBoms(companyId: string, query: QueryBomsDto) {
    const search = query.search?.trim();
    return this.prisma.bom.findMany({
      where: {
        companyId,
        ...(query.productId ? { productId: query.productId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { product: { code: { contains: search, mode: 'insensitive' as const } } },
                { product: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      include: bomInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneBom(id: string, companyId: string) {
    const bom = await this.prisma.bom.findFirst({
      where: { id, companyId },
      include: bomInclude,
    });
    if (!bom) throw new NotFoundException('Lista de materiales no encontrada');
    return bom;
  }

  async createBom(companyId: string, dto: CreateBomDto) {
    await this.assertFinishedProduct(companyId, dto.productId);
    await this.validateBomLines(companyId, dto.productId, dto.lines);

    const existing = await this.prisma.bom.findFirst({
      where: { companyId, productId: dto.productId },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una BOM para este producto');
    }

    return this.prisma.bom.create({
      data: {
        companyId,
        productId: dto.productId,
        name: dto.name,
        notes: dto.notes,
        lines: {
          create: dto.lines.map((line, index) => ({
            componentProductId: line.componentProductId,
            quantity: line.quantity,
            lineOrder: line.lineOrder ?? index,
          })),
        },
      },
      include: bomInclude,
    });
  }

  async updateBom(id: string, companyId: string, dto: UpdateBomDto) {
    const bom = await this.findOneBom(id, companyId);

    if (dto.lines) {
      await this.validateBomLines(companyId, bom.productId, dto.lines);
      await this.prisma.bomLine.deleteMany({ where: { bomId: id } });
      await this.prisma.bomLine.createMany({
        data: dto.lines.map((line, index) => ({
          bomId: id,
          componentProductId: line.componentProductId,
          quantity: line.quantity,
          lineOrder: line.lineOrder ?? index,
        })),
      });
    }

    return this.prisma.bom.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: bomInclude,
    });
  }

  async removeBom(id: string, companyId: string) {
    await this.findOneBom(id, companyId);

    const activeOrder = await this.prisma.manufacturingOrder.findFirst({
      where: {
        bomId: id,
        companyId,
        status: { in: ['draft', 'released'] },
      },
    });
    if (activeOrder) {
      throw new BadRequestException(
        'No se puede eliminar la BOM mientras haya órdenes de fabricación activas',
      );
    }

    await this.prisma.bom.delete({ where: { id } });
  }

  async findAllOrders(companyId: string, query: QueryManufacturingOrdersDto) {
    const search = query.search?.trim();
    return this.prisma.manufacturingOrder.findMany({
      where: {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.bomId ? { bomId: query.bomId } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' as const } },
                { product: { code: { contains: search, mode: 'insensitive' as const } } },
                { product: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrder(id: string, companyId: string) {
    const order = await this.prisma.manufacturingOrder.findFirst({
      where: { id, companyId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Orden de fabricación no encontrada');
    return order;
  }

  async createOrder(companyId: string, dto: CreateManufacturingOrderDto) {
    const bom = await this.findOneBom(dto.bomId, companyId);
    if (!bom.isActive) {
      throw new BadRequestException('La BOM no está activa');
    }

    if (dto.warehouseId) {
      await this.assertWarehouse(companyId, dto.warehouseId);
    }

    const number = await this.nextOrderNumber(companyId);

    return this.prisma.manufacturingOrder.create({
      data: {
        companyId,
        number,
        bomId: bom.id,
        productId: bom.productId,
        warehouseId: dto.warehouseId,
        quantity: dto.quantity,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        notes: dto.notes,
        status: 'draft',
      },
      include: orderInclude,
    });
  }

  async updateOrder(id: string, companyId: string, dto: UpdateManufacturingOrderDto) {
    const order = await this.findOneOrder(id, companyId);
    if (!['draft', 'released'].includes(order.status)) {
      throw new BadRequestException('Solo se pueden editar órdenes en borrador o liberadas');
    }

    if (dto.warehouseId) {
      await this.assertWarehouse(companyId, dto.warehouseId);
    }

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: {
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.warehouseId !== undefined ? { warehouseId: dto.warehouseId } : {}),
        ...(dto.plannedDate !== undefined
          ? { plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: orderInclude,
    });
  }

  async completeOrder(id: string, companyId: string, userId?: string) {
    const order = await this.findOneOrder(id, companyId);
    if (!['draft', 'released'].includes(order.status)) {
      throw new BadRequestException('La orden ya está finalizada o cancelada');
    }

    const qty = Math.round(Number(order.quantity));
    if (qty <= 0) {
      throw new BadRequestException('Cantidad inválida en la orden');
    }

    const components = order.bom.lines.map((line) => ({
      productId: line.componentProductId,
      quantity: Number(line.quantity),
    }));

    await this.inventory.onManufacturingComplete(
      companyId,
      order.warehouseId,
      order.productId,
      qty,
      components,
      order.id,
      userId,
    );

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: {
        status: 'done',
        quantityProduced: qty,
        completedAt: new Date(),
      },
      include: orderInclude,
    });
  }

  async revertCompleteOrder(id: string, companyId: string, userId?: string) {
    const order = await this.findOneOrder(id, companyId);
    if (order.status !== 'done') {
      throw new BadRequestException('Solo se puede revertir una orden completada');
    }

    const qty = Math.round(Number(order.quantityProduced ?? order.quantity));
    const components = order.bom.lines.map((line) => ({
      productId: line.componentProductId,
      quantity: Number(line.quantity),
    }));

    await this.inventory.onManufacturingRevert(
      companyId,
      order.warehouseId,
      order.productId,
      qty,
      components,
      order.id,
      userId,
    );

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: {
        status: 'released',
        quantityProduced: 0,
        completedAt: null,
      },
      include: orderInclude,
    });
  }

  async cancelOrder(id: string, companyId: string) {
    const order = await this.findOneOrder(id, companyId);
    if (order.status === 'done') {
      throw new BadRequestException('No se puede cancelar una orden completada');
    }
    if (order.status === 'cancelled') return order;

    return this.prisma.manufacturingOrder.update({
      where: { id },
      data: { status: 'cancelled' },
      include: orderInclude,
    });
  }

  async removeOrder(id: string, companyId: string) {
    const order = await this.findOneOrder(id, companyId);
    if (order.status !== 'draft') {
      throw new BadRequestException('Solo se pueden eliminar órdenes en borrador');
    }
    await this.prisma.manufacturingOrder.delete({ where: { id } });
  }

  private async nextOrderNumber(companyId: string) {
    const last = await this.prisma.manufacturingOrder.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    const match = last?.number.match(/OF-(\d+)/i);
    const next = match ? Number(match[1]) + 1 : 1;
    return `OF-${String(next).padStart(4, '0')}`;
  }

  private async assertFinishedProduct(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) throw new BadRequestException('Producto terminado no válido');
  }

  private async assertWarehouse(companyId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId, deletedAt: null, isActive: true },
    });
    if (!warehouse) throw new BadRequestException('Almacén no válido');
  }

  private async validateBomLines(
    companyId: string,
    finishedProductId: string,
    lines: { componentProductId: string; quantity: number }[],
  ) {
    const componentIds = new Set<string>();
    for (const line of lines) {
      if (line.componentProductId === finishedProductId) {
        throw new BadRequestException('El producto terminado no puede ser componente de sí mismo');
      }
      if (componentIds.has(line.componentProductId)) {
        throw new BadRequestException('Componente duplicado en la BOM');
      }
      componentIds.add(line.componentProductId);

      const component = await this.prisma.product.findFirst({
        where: { id: line.componentProductId, companyId, deletedAt: null },
      });
      if (!component) {
        throw new BadRequestException('Componente no válido');
      }
    }
  }
}
