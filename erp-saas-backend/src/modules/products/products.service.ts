import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { InventoryService } from '../../common/inventory/inventory.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly inventory: InventoryService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}
  async findAll(companyId: string, query: QueryProductsDto) {
    const [items, total] = await this.repo.findMany(companyId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items: items.map((p) => ({
        ...p,
        price: Number(p.price),
        cost: p.cost != null ? Number(p.cost) : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const product = await this.repo.findById(id, companyId);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return {
      ...product,
      price: Number(product.price),
      cost: product.cost != null ? Number(product.cost) : null,
    };
  }

  async create(companyId: string, dto: CreateProductDto) {
    const initialStock = dto.stock ?? 0;
    const { stock: _stock, ...rest } = dto;
    try {
      const product = await this.repo.create(companyId, { ...rest, stock: 0 });
      if (initialStock > 0) {
        const warehouseId = await this.inventory.resolveWarehouseId(companyId);
        await this.inventory.setWarehouseStock(
          companyId,
          warehouseId,
          product.id,
          initialStock,
          'Stock inicial al crear producto',
        );
      }
      this.cacheInvalidation.onBusinessDataChanged(companyId);
      return this.findOne(product.id, companyId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya existe un producto con ese código');
      }
      throw e;
    }
  }

  async update(id: string, companyId: string, dto: UpdateProductDto) {
    await this.findOne(id, companyId);
    const { stock: _stock, ...rest } = dto;
    try {
      const product = await this.repo.update(id, rest);
      this.cacheInvalidation.onBusinessDataChanged(companyId);
      return {
        ...product,
        price: Number(product.price),
        cost: product.cost != null ? Number(product.cost) : null,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya existe un producto con ese código');
      }
      throw e;
    }
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return { message: 'Producto eliminado' };
  }

  async findLowStock(companyId: string, limit = 10) {
    const items = await this.repo.findLowStock(companyId, limit);
    return items.map((p) => ({
      ...p,
      price: Number(p.price),
      cost: p.cost != null ? Number(p.cost) : null,
    }));
  }

  getStockBreakdown(id: string, companyId: string) {
    return this.inventory.getProductStockBreakdown(companyId, id);
  }
}
