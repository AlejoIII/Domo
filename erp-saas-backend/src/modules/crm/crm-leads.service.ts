import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';

import { CrmStagesService } from './crm-stages.service';

import { CrmCatalogResolverService } from './crm-catalog-resolver.service';

import {

  ConvertCrmLeadDto,

  CreateCrmLeadDto,

  QueryCrmLeadsDto,

  UpdateCrmLeadDto,

} from './dto/crm-lead.dto';

import { mapUser } from './crm.mapper';



const catalogSelect = {

  id: true,

  name: true,

  code: true,

  color: true,

} as const;



const leadInclude = {

  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },

  client: { select: { id: true, name: true } },

  statusCatalog: { select: catalogSelect },

} as const;



@Injectable()

export class CrmLeadsService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly stages: CrmStagesService,

    private readonly catalogs: CrmCatalogResolverService,

  ) {}



  async findAll(companyId: string, query: QueryCrmLeadsDto) {

    const where = {

      companyId,

      ...(query.status ? { status: query.status } : {}),

      ...(query.search

        ? {

            OR: [

              { name: { contains: query.search, mode: 'insensitive' as const } },

              { email: { contains: query.search, mode: 'insensitive' as const } },

              { companyName: { contains: query.search, mode: 'insensitive' as const } },

            ],

          }

        : {}),

    };



    const items = await this.prisma.crmLead.findMany({

      where,

      orderBy: { createdAt: 'desc' },

      include: leadInclude,

    });



    return items.map((l) => this.mapLead(l));

  }



  async findOne(id: string, companyId: string) {

    const lead = await this.prisma.crmLead.findFirst({

      where: { id, companyId },

      include: leadInclude,

    });

    if (!lead) throw new NotFoundException('Lead no encontrado');

    return this.mapLead(lead);

  }



  async create(companyId: string, dto: CreateCrmLeadDto) {

    const status = await this.catalogs.resolveLeadStatus(companyId, {

      statusId: dto.statusId,

      status: dto.status,

    });



    const lead = await this.prisma.crmLead.create({

      data: {

        companyId,

        name: dto.name,

        email: dto.email,

        phone: dto.phone,

        companyName: dto.companyName,

        source: dto.source,

        status: status.status,

        statusId: status.statusId,

        notes: dto.notes,

        assignedToId: dto.assignedToId,

      },

      include: leadInclude,

    });

    return this.mapLead(lead);

  }



  async update(id: string, companyId: string, dto: UpdateCrmLeadDto) {

    await this.findOne(id, companyId);



    let statusData: { status?: string; statusId?: string | null } = {};

    if (dto.statusId !== undefined || dto.status !== undefined) {

      const resolved = await this.catalogs.resolveLeadStatus(companyId, {

        statusId: dto.statusId,

        status: dto.status,

      });

      statusData = { status: resolved.status, statusId: resolved.statusId };

    }



    const lead = await this.prisma.crmLead.update({

      where: { id },

      data: {

        ...(dto.name !== undefined ? { name: dto.name } : {}),

        ...(dto.email !== undefined ? { email: dto.email } : {}),

        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),

        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),

        ...(dto.source !== undefined ? { source: dto.source } : {}),

        ...statusData,

        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),

        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),

      },

      include: leadInclude,

    });

    return this.mapLead(lead);

  }



  async remove(id: string, companyId: string) {

    await this.findOne(id, companyId);

    await this.prisma.crmLead.delete({ where: { id } });

    return { message: 'Lead eliminado' };

  }



  async convert(id: string, companyId: string, dto: ConvertCrmLeadDto) {

    const lead = await this.prisma.crmLead.findFirst({ where: { id, companyId } });

    if (!lead) throw new NotFoundException('Lead no encontrado');

    if (lead.status === 'converted') {

      throw new BadRequestException('El lead ya fue convertido');

    }



    const client = await this.prisma.client.create({

      data: {

        companyId,

        name: lead.companyName?.trim() || lead.name,

        email: lead.email,

        phone: lead.phone,

        segment: 'lead',

        notes: lead.notes,

      },

    });



    let opportunity = null;

    if (dto.createOpportunity !== false) {

      const stage = await this.stages.getFirstOpenStage(companyId);

      if (!stage) throw new BadRequestException('Pipeline CRM no configurado');



      opportunity = await this.prisma.crmOpportunity.create({

        data: {

          companyId,

          title: dto.opportunityTitle ?? `Oportunidad — ${lead.name}`,

          stageId: stage.id,

          clientId: client.id,

          leadId: lead.id,

          amount: dto.amount,

          assignedToId: lead.assignedToId,

        },

        include: {

          stage: true,

          client: { select: { id: true, name: true } },

          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },

        },

      });

    }



    const convertedStatus = await this.catalogs.resolveLeadStatus(companyId, {

      status: 'converted',

    });



    await this.prisma.crmLead.update({

      where: { id },

      data: {

        status: convertedStatus.status,

        statusId: convertedStatus.statusId,

        clientId: client.id,

      },

    });



    return {

      client: { id: client.id, name: client.name },

      opportunity: opportunity

        ? {

            id: opportunity.id,

            title: opportunity.title,

            stage: opportunity.stage,

            client: opportunity.client,

            amount: opportunity.amount ? Number(opportunity.amount) : null,

          }

        : null,

    };

  }



  private mapLead(lead: {

    id: string;

    name: string;

    email: string | null;

    phone: string | null;

    companyName: string | null;

    source: string | null;

    status: string;

    statusId: string | null;

    notes: string | null;

    clientId: string | null;

    assignedToId: string | null;

    createdAt: Date;

    updatedAt: Date;

    assignedTo?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;

    client?: { id: string; name: string } | null;

    statusCatalog?: { id: string; name: string; code: string | null; color: string | null } | null;

  }) {

    return {

      id: lead.id,

      name: lead.name,

      email: lead.email,

      phone: lead.phone,

      companyName: lead.companyName,

      source: lead.source,

      status: lead.status,

      statusId: lead.statusId,

      statusCatalog: this.catalogs.mapCatalogRef(lead.statusCatalog),

      notes: lead.notes,

      clientId: lead.clientId,

      client: lead.client,

      assignedTo: mapUser(lead.assignedTo),

      createdAt: lead.createdAt.toISOString(),

      updatedAt: lead.updatedAt.toISOString(),

    };

  }

}


