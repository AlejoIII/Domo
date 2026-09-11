import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async findAll(companyId: string, query: QueryCategoriesDto) {
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
    const category = await this.repo.findById(id, companyId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  create(companyId: string, dto: CreateCategoryDto) {
    return this.repo.create(companyId, dto);
  }

  async update(id: string, companyId: string, dto: UpdateCategoryDto) {
    await this.findOne(id, companyId);
    return this.repo.update(id, companyId, dto);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id, companyId);
    return { message: 'Categoría eliminada' };
  }
}
