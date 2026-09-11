import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly repo: EmployeesRepository) {}

  async findAll(companyId: string, query: QueryEmployeesDto) {
    const [items, total] = await this.repo.findMany(companyId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const employee = await this.repo.findById(id, companyId);
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  create(companyId: string, dto: CreateEmployeeDto) {
    return this.repo.create(companyId, dto);
  }

  async update(id: string, companyId: string, dto: UpdateEmployeeDto) {
    await this.findOne(id, companyId);
    return this.repo.update(id, dto);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id);
    return { message: 'Empleado eliminado' };
  }
}
