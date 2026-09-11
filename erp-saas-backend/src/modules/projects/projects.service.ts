import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import {
  CreateProjectDto,
  GenerateProjectInvoiceDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/project.dto';

const projectInclude = {
  client: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoicesService,
  ) {}

  async findAll(companyId: string, query: QueryProjectsDto) {
    const items = await this.prisma.project.findMany({
      where: {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { code: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(items.map((p) => this.mapProject(companyId, p)));
  }

  async findOne(id: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: projectInclude,
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return this.mapProject(companyId, project);
  }

  async create(companyId: string, dto: CreateProjectDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, companyId, deletedAt: null },
    });
    if (!client) throw new BadRequestException('Cliente no válido');

    const project = await this.prisma.project.create({
      data: {
        companyId,
        clientId: dto.clientId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status ?? 'active',
        hourlyRate: dto.hourlyRate ?? 0,
        budgetHours: dto.budgetHours,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: projectInclude,
    });

    return this.mapProject(companyId, project);
  }

  async update(id: string, companyId: string, dto: UpdateProjectDto) {
    await this.findOne(id, companyId);
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, companyId, deletedAt: null },
      });
      if (!client) throw new BadRequestException('Cliente no válido');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        hourlyRate: dto.hourlyRate,
        budgetHours: dto.budgetHours,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: projectInclude,
    });

    return this.mapProject(companyId, project);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Proyecto eliminado' };
  }

  async getSummary(id: string, companyId: string) {
    const project = await this.findOne(id, companyId);
    const entries = await this.prisma.timeEntry.findMany({
      where: { projectId: id, companyId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { entryDate: 'desc' },
    });

    let totalHours = 0;
    let billableHours = 0;
    let unbilledHours = 0;
    let billedAmount = 0;
    let unbilledAmount = 0;
    const rate = project.hourlyRate;

    for (const e of entries) {
      const h = Number(e.hours);
      totalHours += h;
      if (e.billable) {
        billableHours += h;
        const amount = h * rate;
        if (e.invoiceId) billedAmount += amount;
        else unbilledAmount += amount;
        if (!e.invoiceId) unbilledHours += h;
      }
    }

    return {
      project,
      totals: {
        totalHours,
        billableHours,
        unbilledHours,
        billedAmount,
        unbilledAmount,
        budgetHours: project.budgetHours,
        budgetUsedPct:
          project.budgetHours && project.budgetHours > 0
            ? Math.round((totalHours / project.budgetHours) * 100)
            : null,
      },
      recentEntries: entries.slice(0, 10).map((e) => ({
        id: e.id,
        entryDate: e.entryDate.toISOString().slice(0, 10),
        hours: Number(e.hours),
        billable: e.billable,
        invoiced: !!e.invoiceId,
        description: e.description,
        employee: {
          id: e.employee.id,
          name: [e.employee.firstName, e.employee.lastName].filter(Boolean).join(' '),
        },
      })),
    };
  }

  async generateInvoice(id: string, companyId: string, dto: GenerateProjectInvoiceDto) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: { client: true },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const rate = Number(project.hourlyRate);
    if (rate <= 0) {
      throw new BadRequestException('El proyecto debe tener una tarifa horaria mayor que 0');
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        projectId: id,
        companyId,
        billable: true,
        invoiceId: null,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ employeeId: 'asc' }, { entryDate: 'asc' }],
    });

    if (entries.length === 0) {
      throw new BadRequestException('No hay horas pendientes de facturar');
    }

    const byEmployee = new Map<string, { name: string; hours: number; descriptions: string[] }>();
    for (const e of entries) {
      const name = [e.employee.firstName, e.employee.lastName].filter(Boolean).join(' ');
      const current = byEmployee.get(e.employeeId) ?? { name, hours: 0, descriptions: [] };
      current.hours += Number(e.hours);
      if (e.description) current.descriptions.push(e.description);
      byEmployee.set(e.employeeId, current);
    }

    const lines = [...byEmployee.values()].map((row) => ({
      description: `${project.name} — ${row.name}${row.descriptions.length ? `: ${row.descriptions[0]}` : ''}`,
      quantity: Math.round(row.hours * 100) / 100,
      unitPrice: rate,
    }));

    const invoice = await this.invoices.create(companyId, {
      clientId: project.clientId,
      status: 'draft',
      notes:
        dto.notes ??
        `Horas del proyecto ${project.name}${project.code ? ` (${project.code})` : ''}`,
      taxRate: dto.taxRate,
      lines,
    });

    await this.prisma.timeEntry.updateMany({
      where: { id: { in: entries.map((e) => e.id) } },
      data: { invoiceId: invoice.id },
    });

    return {
      invoice: { id: invoice.id, number: invoice.number, total: invoice.total },
      entriesBilled: entries.length,
      hoursBilled: entries.reduce((s, e) => s + Number(e.hours), 0),
    };
  }

  private async mapProject(
    companyId: string,
    project: {
      id: string;
      clientId: string;
      name: string;
      code: string | null;
      description: string | null;
      status: string;
      hourlyRate: { toNumber?: () => number } | number | string;
      budgetHours: { toNumber?: () => number } | number | string | null;
      startDate: Date | null;
      endDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
      client?: { id: string; name: string };
    },
  ) {
    const agg = await this.prisma.timeEntry.groupBy({
      by: ['billable'],
      where: { projectId: project.id, companyId },
      _sum: { hours: true },
    });

    let totalHours = 0;
    let unbilledHours = 0;
    for (const row of agg) {
      const h = Number(row._sum.hours ?? 0);
      totalHours += h;
    }

    const unbilled = await this.prisma.timeEntry.aggregate({
      where: { projectId: project.id, companyId, billable: true, invoiceId: null },
      _sum: { hours: true },
    });
    unbilledHours = Number(unbilled._sum.hours ?? 0);

    const rate = Number(project.hourlyRate);

    return {
      id: project.id,
      clientId: project.clientId,
      client: project.client,
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      hourlyRate: rate,
      budgetHours: project.budgetHours != null ? Number(project.budgetHours) : null,
      startDate: project.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: project.endDate?.toISOString().slice(0, 10) ?? null,
      totalHours,
      unbilledHours,
      unbilledAmount: unbilledHours * rate,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
