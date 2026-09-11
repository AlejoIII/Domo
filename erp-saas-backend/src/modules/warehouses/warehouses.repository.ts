import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto, UpsertWarehouseStockDto } from './dto/warehouse.dto';
import { QueryWarehousesDto } from './dto/query-warehouses.dto';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(companyId: string, query: QueryWarehousesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { city: { contains: query.search, mode: 'insensitive' as const } },
              { address: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouse.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.warehouse.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        stocks: {
          include: {
            product: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  create(companyId: string, dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: { ...dto, companyId },
    });
  }

  update(id: string, companyId: string, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  softDelete(id: string, companyId: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  upsertStock(warehouseId: string, dto: UpsertWarehouseStockDto) {
    return this.prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: dto.productId,
        },
      },
      create: {
        warehouseId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: dto.quantity,
      },
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
    });
  }
}
