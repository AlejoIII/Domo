import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(companyId: string, query: QueryEmployeesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.department ? { department: query.department } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { jobTitle: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.employee.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.employee.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  create(companyId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        companyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        department: dto.department,
        imageUrl: dto.imageUrl,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  update(id: string, dto: UpdateEmployeeDto) {
    const { hireDate, ...rest } = dto;
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        ...(hireDate !== undefined ? { hireDate: hireDate ? new Date(hireDate) : null } : {}),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
