import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(companyId: string, query: QuerySuppliersDto) {
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
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
              { taxId: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  create(companyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: { ...dto, companyId },
    });
  }

  update(id: string, companyId: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  softDelete(id: string, companyId: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
