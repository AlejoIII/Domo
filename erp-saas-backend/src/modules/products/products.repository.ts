import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

function isLowStock(stock: number, minStock: number) {
  return minStock > 0 && stock <= minStock;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(companyId: string, query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.lowStock) {
      return this.findManyLowStock(companyId, page, limit, query);
    }

    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, query);

    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.product.count({ where }),
    ]);
  }

  private async findManyLowStock(
    companyId: string,
    page: number,
    limit: number,
    query: QueryProductsDto,
  ) {
    const where = this.buildWhere(companyId, query);
    const all = await this.prisma.product.findMany({
      where: { ...where, minStock: { gt: 0 } },
      orderBy: { stock: 'asc' },
    });
    const filtered = all.filter((p) => isLowStock(p.stock, p.minStock));
    const skip = (page - 1) * limit;
    return [filtered.slice(skip, skip + limit), filtered.length] as const;
  }

  findLowStock(companyId: string, limit = 10) {
    return this.prisma.product.findMany({
      where: { companyId, deletedAt: null, minStock: { gt: 0 }, isActive: true },
      orderBy: { stock: 'asc' },
      take: 50,
    }).then((items) =>
      items.filter((p) => isLowStock(p.stock, p.minStock)).slice(0, limit),
    );
  }

  countLowStock(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, deletedAt: null, minStock: { gt: 0 }, isActive: true },
      select: { stock: true, minStock: true },
    }).then((items) => items.filter((p) => isLowStock(p.stock, p.minStock)).length);
  }

  private buildWhere(companyId: string, query: QueryProductsDto) {
    let isActive: boolean | undefined;
    if (query.active === 'true' || query.active === '1') isActive = true;
    if (query.active === 'false' || query.active === '0') isActive = false;

    return {
      companyId,
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { barcode: { contains: query.search, mode: 'insensitive' as const } },
              { category: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  findById(id: string, companyId: string) {
    return this.prisma.product.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  create(companyId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        categoryId: dto.categoryId,
        price: dto.price ?? 0,
        cost: dto.cost,
        stock: dto.stock ?? 0,
        minStock: dto.minStock ?? 0,
        unit: dto.unit ?? 'ud',
        barcode: dto.barcode,
        imageUrl: dto.imageUrl,
      },
    });
  }

  update(id: string, dto: UpdateProductDto) {
    const data: Prisma.ProductUpdateInput = { ...dto };
    return this.prisma.product.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export { isLowStock };
