import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto, UpdateWarehouseDto, UpsertWarehouseStockDto } from './dto/warehouse.dto';
import { QueryWarehousesDto } from './dto/query-warehouses.dto';
import { InventoryService } from '../../common/inventory/inventory.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly repo: WarehousesRepository,
    private readonly inventory: InventoryService,
  ) {}

  async findAll(companyId: string, query: QueryWarehousesDto) {
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
    const warehouse = await this.repo.findById(id, companyId);
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    return warehouse;
  }

  create(companyId: string, dto: CreateWarehouseDto) {
    return this.repo.create(companyId, dto);
  }

  async update(id: string, companyId: string, dto: UpdateWarehouseDto) {
    await this.findOne(id, companyId);
    return this.repo.update(id, companyId, dto);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id, companyId);
    return { message: 'Almacén eliminado' };
  }

  async upsertStock(
    id: string,
    companyId: string,
    dto: UpsertWarehouseStockDto,
    userId?: string,
  ) {
    await this.findOne(id, companyId);
    await this.inventory.setWarehouseStock(
      companyId,
      id,
      dto.productId,
      dto.quantity,
      dto.notes,
      userId,
    );
    return this.findOne(id, companyId);
  }
}
