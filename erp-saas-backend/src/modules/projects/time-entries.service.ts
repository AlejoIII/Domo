import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateTimeEntryDto, QueryTimeEntriesDto, UpdateTimeEntryDto } from './dto/time-entry.dto';

const entryInclude = {
  project: { select: { id: true, name: true, code: true, hourlyRate: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
  invoice: { select: { id: true, number: true } },
} as const;

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: QueryTimeEntriesDto) {
    const where = this.buildWhere(companyId, query);
    const items = await this.prisma.timeEntry.findMany({
      where,
      include: entryInclude,
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
    });
    return items.map((e) => this.mapEntry(e));
  }

  async create(projectId: string, companyId: string, dto: CreateTimeEntryDto) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId, deletedAt: null, isActive: true },
    });
    if (!employee) throw new BadRequestException('Empleado no válido');

    const entry = await this.prisma.timeEntry.create({
      data: {
        companyId,
        projectId,
        employeeId: dto.employeeId,
        entryDate: new Date(dto.entryDate),
        hours: dto.hours,
        description: dto.description,
        billable: dto.billable ?? true,
      },
      include: entryInclude,
    });

    return this.mapEntry(entry);
  }

  async update(id: string, companyId: string, dto: UpdateTimeEntryDto) {
    const existing = await this.prisma.timeEntry.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Parte de horas no encontrado');
    if (existing.invoiceId) {
      throw new BadRequestException('No se puede editar un parte ya facturado');
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: dto.employeeId, companyId, deletedAt: null },
      });
      if (!employee) throw new BadRequestException('Empleado no válido');
    }

    const entry = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        hours: dto.hours,
        description: dto.description,
        billable: dto.billable,
      },
      include: entryInclude,
    });

    return this.mapEntry(entry);
  }

  async remove(id: string, companyId: string) {
    const existing = await this.prisma.timeEntry.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Parte de horas no encontrado');
    if (existing.invoiceId) {
      throw new BadRequestException('No se puede eliminar un parte ya facturado');
    }

    await this.prisma.timeEntry.delete({ where: { id } });
    return { message: 'Parte de horas eliminado' };
  }

  private buildWhere(companyId: string, query: QueryTimeEntriesDto) {
    const where: Record<string, unknown> = { companyId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.unbilled === '1' || query.unbilled === 'true') {
      where.invoiceId = null;
      where.billable = true;
    }
    if (query.from || query.to) {
      const entryDate: { gte?: Date; lte?: Date } = {};
      if (query.from) entryDate.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        entryDate.lte = end;
      }
      where.entryDate = entryDate;
    }
    return where;
  }

  private mapEntry(e: {
    id: string;
    projectId: string;
    employeeId: string;
    entryDate: Date;
    hours: { toNumber?: () => number } | number | string;
    description: string | null;
    billable: boolean;
    invoiceId: string | null;
    createdAt: Date;
    project?: { id: string; name: string; code: string | null; hourlyRate: { toNumber?: () => number } | number | string };
    employee?: { id: string; firstName: string; lastName: string };
    invoice?: { id: string; number: string } | null;
  }) {
    const rate = e.project ? Number(e.project.hourlyRate) : 0;
    const hours = Number(e.hours);
    return {
      id: e.id,
      projectId: e.projectId,
      project: e.project
        ? { id: e.project.id, name: e.project.name, code: e.project.code, hourlyRate: rate }
        : undefined,
      employeeId: e.employeeId,
      employee: e.employee
        ? {
            id: e.employee.id,
            name: [e.employee.firstName, e.employee.lastName].filter(Boolean).join(' '),
          }
        : undefined,
      entryDate: e.entryDate.toISOString().slice(0, 10),
      hours,
      description: e.description,
      billable: e.billable,
      amount: e.billable ? hours * rate : 0,
      invoiceId: e.invoiceId,
      invoice: e.invoice,
      createdAt: e.createdAt.toISOString(),
    };
  }
}
