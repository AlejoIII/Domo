import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateCrmIncidentDto,
  QueryCrmIncidentsDto,
  UpdateCrmIncidentDto,
} from './dto/crm-incident.dto';
import { mapUser } from './crm.mapper';

const catalogSelect = {
  id: true,
  name: true,
  code: true,
  color: true,
} as const;

const incidentInclude = {
  typeCatalog: { select: catalogSelect },
  client: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  opportunity: { select: { id: true, title: true } },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const;

@Injectable()
export class CrmIncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: QueryCrmIncidentsDto) {
    return this.prisma.crmIncident.findMany({
      where: {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' as const } },
                { description: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: incidentInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }).then((rows) => rows.map((row) => this.mapIncident(row)));
  }

  async findOne(id: string, companyId: string) {
    const item = await this.prisma.crmIncident.findFirst({
      where: { id, companyId },
      include: incidentInclude,
    });
    if (!item) throw new NotFoundException('Incidencia no encontrada');
    return this.mapIncident(item);
  }

  async create(companyId: string, dto: CreateCrmIncidentDto) {
    const created = await this.prisma.crmIncident.create({
      data: {
        companyId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority ?? 'medium',
        typeId: dto.typeId ?? null,
        clientId: dto.clientId ?? null,
        leadId: dto.leadId ?? null,
        opportunityId: dto.opportunityId ?? null,
        assignedToId: dto.assignedToId ?? null,
      },
      include: incidentInclude,
    });
    return this.mapIncident(created);
  }

  async update(id: string, companyId: string, dto: UpdateCrmIncidentDto) {
    await this.findOne(id, companyId);

    const resolvedAt =
      dto.status === 'resolved' || dto.status === 'closed'
        ? new Date()
        : dto.status === 'open' || dto.status === 'in_progress'
          ? null
          : undefined;

    const updated = await this.prisma.crmIncident.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.typeId !== undefined ? { typeId: dto.typeId } : {}),
        ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId } : {}),
        ...(dto.opportunityId !== undefined ? { opportunityId: dto.opportunityId } : {}),
        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
      },
      include: incidentInclude,
    });
    return this.mapIncident(updated);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.crmIncident.delete({ where: { id } });
    return { message: 'Incidencia eliminada' };
  }

  private mapIncident(row: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    typeId: string | null;
    clientId: string | null;
    leadId: string | null;
    opportunityId: string | null;
    assignedToId: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    typeCatalog: { id: string; name: string; code: string | null; color: string | null } | null;
    client: { id: string; name: string } | null;
    lead: { id: string; name: string } | null;
    opportunity: { id: string; title: string } | null;
    assignedTo: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  }) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      typeId: row.typeId,
      typeCatalog: row.typeCatalog,
      clientId: row.clientId,
      client: row.client,
      leadId: row.leadId,
      lead: row.lead,
      opportunityId: row.opportunityId,
      opportunity: row.opportunity,
      assignedTo: mapUser(row.assignedTo),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
