import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { InventoryService } from '../../common/inventory/inventory.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly invoicesService: InvoicesService,
    private readonly inventory: InventoryService,
    private readonly planLimits: PlanLimitsService,
    private readonly webhooks: WebhookDispatcherService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async findAll(companyId: string, query: QueryOrdersDto) {
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
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async create(companyId: string, dto: CreateOrderDto, userId?: string) {
    await this.planLimits.assertCanCreateDocument(companyId);
    const order = await this.repo.create(companyId, dto);
    if (dto.status && dto.status !== 'draft') {
      await this.inventory.onSalesOrderStatusChange(
        companyId,
        order.warehouseId,
        'draft',
        dto.status,
        dto.lines.map((l) => ({
          productId: l.productId ?? null,
          quantity: l.quantity,
        })),
        order.id,
        userId,
      );
    }
    if (dto.status === 'confirmed') {
      this.emitOrderConfirmed(companyId, order);
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return order;
  }

  async update(id: string, companyId: string, dto: UpdateOrderDto, userId?: string) {
    const previous = await this.findOne(id, companyId);
    const updated = await this.repo.update(id, companyId, dto);
    if (!updated) throw new NotFoundException('Pedido no encontrado');

    if (dto.status && dto.status !== previous.status) {
      await this.inventory.onSalesOrderStatusChange(
        companyId,
        updated.warehouseId ?? previous.warehouseId,
        previous.status,
        dto.status,
        updated.lines,
        id,
        userId,
      );
      if (dto.status === 'confirmed' && previous.status !== 'confirmed') {
        this.emitOrderConfirmed(companyId, updated);
      }
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return updated;
  }

  private emitOrderConfirmed(companyId: string, order: { id: string; number: string; clientId: string }) {
    this.webhooks.emit(companyId, 'order.confirmed', {
      orderId: order.id,
      number: order.number,
      clientId: order.clientId,
      confirmedAt: new Date().toISOString(),
    });
  }

  async remove(id: string, companyId: string, userId?: string) {
    const order = await this.findOne(id, companyId);
    await this.inventory.onSalesOrderStatusChange(
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
    return { message: 'Pedido eliminado' };
  }

  async convertToInvoice(id: string, companyId: string) {
    const order = await this.findOne(id, companyId);
    if (order.status === 'cancelled') {
      throw new BadRequestException('No se puede facturar un pedido cancelado');
    }
    if (order.status === 'invoiced') {
      throw new BadRequestException('Este pedido ya está facturado');
    }

    const invoice = await this.invoicesService.create(companyId, {
      clientId: order.clientId,
      orderId: order.id,
      status: 'issued',
      taxRate: Number(order.taxRate),
      notes: order.notes ?? undefined,
      lines: order.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });

    await this.update(id, companyId, { status: 'invoiced' });
    return invoice;
  }

  async duplicate(id: string, companyId: string) {
    const copy = await this.repo.duplicate(id, companyId);
    if (!copy) throw new NotFoundException('Pedido no encontrado');
    return copy;
  }

  async unconfirm(id: string, companyId: string, userId?: string) {
    const order = await this.findOne(id, companyId);
    if (order.status !== 'confirmed') {
      throw new BadRequestException(
        'Solo se puede deshacer la confirmación de pedidos en estado confirmado',
      );
    }

    return this.update(id, companyId, { status: 'draft' }, userId);
  }
}
