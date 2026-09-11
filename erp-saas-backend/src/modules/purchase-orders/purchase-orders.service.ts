import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { QueryPurchaseOrdersDto } from './dto/query-purchase-orders.dto';
import { InventoryService } from '../../common/inventory/inventory.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repo: PurchaseOrdersRepository,
    private readonly inventory: InventoryService,
    private readonly planLimits: PlanLimitsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async findAll(companyId: string, query: QueryPurchaseOrdersDto) {
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
    const order = await this.repo.findById(id, companyId);
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async create(companyId: string, dto: CreatePurchaseOrderDto, userId?: string) {
    await this.planLimits.assertCanCreateDocument(companyId);
    const order = await this.repo.create(companyId, dto);
    if (dto.status === 'received') {
      await this.inventory.onPurchaseOrderStatusChange(
        companyId,
        order.warehouseId,
        'draft',
        'received',
        order.lines,
        order.id,
        userId,
      );
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return order;
  }

  async update(id: string, companyId: string, dto: UpdatePurchaseOrderDto, userId?: string) {
    const previous = await this.findOne(id, companyId);
    const updated = await this.repo.update(id, companyId, dto);
    if (!updated) throw new NotFoundException('Orden de compra no encontrada');

    if (dto.status && dto.status !== previous.status) {
      await this.inventory.onPurchaseOrderStatusChange(
        companyId,
        updated.warehouseId ?? previous.warehouseId,
        previous.status,
        dto.status,
        updated.lines,
        id,
        userId,
      );
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return updated;
  }

  async remove(id: string, companyId: string, userId?: string) {
    const order = await this.findOne(id, companyId);
    await this.inventory.onPurchaseOrderStatusChange(
      companyId,
      order.warehouseId,
      order.status,
      'cancelled',
      order.lines,
      id,
      userId,
    );
    await this.repo.softDelete(id);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return { message: 'Orden de compra eliminada' };
  }

  async duplicate(id: string, companyId: string) {
    const copy = await this.repo.duplicate(id, companyId);
    if (!copy) throw new NotFoundException('Orden de compra no encontrada');
    return copy;
  }
}
