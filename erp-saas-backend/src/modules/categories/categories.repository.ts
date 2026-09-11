import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(companyId: string, query: QueryCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.category.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  create(companyId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, companyId },
    });
  }

  update(id: string, companyId: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  softDelete(id: string, companyId: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
