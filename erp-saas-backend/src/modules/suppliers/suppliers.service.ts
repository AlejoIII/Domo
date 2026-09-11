import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly repo: SuppliersRepository) {}

  async findAll(companyId: string, query: QuerySuppliersDto) {
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
    const supplier = await this.repo.findById(id, companyId);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  create(companyId: string, dto: CreateSupplierDto) {
    return this.repo.create(companyId, dto);
  }

  async update(id: string, companyId: string, dto: UpdateSupplierDto) {
    await this.findOne(id, companyId);
    return this.repo.update(id, companyId, dto);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id, companyId);
    return { message: 'Proveedor eliminado' };
  }
}
