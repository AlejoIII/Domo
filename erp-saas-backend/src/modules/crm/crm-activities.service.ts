import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';

import { CrmCatalogResolverService } from './crm-catalog-resolver.service';

import {

  CreateCrmActivityDto,

  QueryCrmActivitiesDto,

  UpdateCrmActivityDto,

} from './dto/crm-activity.dto';

import { mapUser } from './crm.mapper';



const catalogSelect = {

  id: true,

  name: true,

  code: true,

  color: true,

} as const;



const activityInclude = {

  lead: { select: { id: true, name: true } },

  opportunity: { select: { id: true, title: true } },

  client: { select: { id: true, name: true } },

  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },

  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },

  taskTypeCatalog: { select: catalogSelect },

  subjectCatalog: { select: catalogSelect },

  situationCatalog: { select: catalogSelect },

  agendaClassification: { select: catalogSelect },

} as const;



@Injectable()

export class CrmActivitiesService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly catalogs: CrmCatalogResolverService,

  ) {}



  async findAll(companyId: string, query: QueryCrmActivitiesDto) {

    const pending = query.pending === '1' || query.pending === 'true';



    const items = await this.prisma.crmActivity.findMany({

      where: {

        companyId,

        ...(query.type ? { type: query.type } : {}),

        ...(query.leadId ? { leadId: query.leadId } : {}),

        ...(query.opportunityId ? { opportunityId: query.opportunityId } : {}),

        ...(query.clientId ? { clientId: query.clientId } : {}),

        ...(pending ? { completedAt: null } : {}),

      },

      include: activityInclude,

      orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],

    });



    return items.map((a) => this.mapActivity(a));

  }



  async findOne(id: string, companyId: string) {

    const activity = await this.prisma.crmActivity.findFirst({

      where: { id, companyId },

      include: activityInclude,

    });

    if (!activity) throw new NotFoundException('Actividad no encontrada');

    return this.mapActivity(activity);

  }



  async create(companyId: string, dto: CreateCrmActivityDto, userId?: string) {

    const taskType = await this.catalogs.resolveActivityTaskType(companyId, {

      taskTypeId: dto.taskTypeId,

      type: dto.type,

    });

    const subject = await this.catalogs.resolveActivitySubject(companyId, {

      subject: dto.subject ?? '',

      subjectCatalogId: dto.subjectCatalogId,

    });

    const situationId = await this.catalogs.resolveOptionalCatalogId(

      companyId,

      'task_situation',

      dto.situationId,

    );

    const agendaClassificationId = await this.catalogs.resolveOptionalCatalogId(

      companyId,

      'agenda_classification',

      dto.agendaClassificationId,

    );



    const activity = await this.prisma.crmActivity.create({

      data: {

        companyId,

        type: taskType.type,

        taskTypeId: taskType.taskTypeId,

        subject: subject.subject,

        subjectCatalogId: subject.subjectCatalogId,

        situationId,

        agendaClassificationId,

        description: dto.description,

        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,

        leadId: dto.leadId,

        opportunityId: dto.opportunityId,

        clientId: dto.clientId,

        assignedToId: dto.assignedToId,

        createdById: userId,

      },

      include: activityInclude,

    });



    return this.mapActivity(activity);

  }



  async update(id: string, companyId: string, dto: UpdateCrmActivityDto) {

    await this.findOne(id, companyId);



    let taskTypeData: { type?: string; taskTypeId?: string | null } = {};

    if (dto.taskTypeId !== undefined || dto.type !== undefined) {

      const resolved = await this.catalogs.resolveActivityTaskType(companyId, {

        taskTypeId: dto.taskTypeId,

        type: dto.type,

      });

      taskTypeData = { type: resolved.type, taskTypeId: resolved.taskTypeId };

    }



    let subjectData: { subject?: string; subjectCatalogId?: string | null } = {};

    if (dto.subject !== undefined || dto.subjectCatalogId !== undefined) {

      const current = await this.prisma.crmActivity.findFirst({

        where: { id, companyId },

        select: { subject: true },

      });

      const resolved = await this.catalogs.resolveActivitySubject(companyId, {

        subject: dto.subject ?? current?.subject ?? '',

        subjectCatalogId: dto.subjectCatalogId,

      });

      subjectData = {

        subject: resolved.subject,

        subjectCatalogId: resolved.subjectCatalogId,

      };

    }



    const activity = await this.prisma.crmActivity.update({

      where: { id },

      data: {

        ...taskTypeData,

        ...subjectData,

        ...(dto.description !== undefined ? { description: dto.description } : {}),

        ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null } : {}),

        ...(dto.completedAt !== undefined

          ? { completedAt: dto.completedAt ? new Date(dto.completedAt) : null }

          : {}),

        ...(dto.situationId !== undefined

          ? {

              situationId: await this.catalogs.resolveOptionalCatalogId(

                companyId,

                'task_situation',

                dto.situationId,

              ),

            }

          : {}),

        ...(dto.agendaClassificationId !== undefined

          ? {

              agendaClassificationId: await this.catalogs.resolveOptionalCatalogId(

                companyId,

                'agenda_classification',

                dto.agendaClassificationId,

              ),

            }

          : {}),

        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),

      },

      include: activityInclude,

    });

    return this.mapActivity(activity);

  }



  async complete(id: string, companyId: string) {

    await this.findOne(id, companyId);



    let situationId: string | null | undefined;

    const doneSituation = await this.prisma.crmCatalogItem.findFirst({

      where: {

        companyId,

        category: 'task_situation',

        isActive: true,

        OR: [{ code: 'done' }, { name: { equals: 'Completada', mode: 'insensitive' } }],

      },

      select: { id: true },

    });

    if (doneSituation) {

      situationId = doneSituation.id;

    }



    const activity = await this.prisma.crmActivity.update({

      where: { id },

      data: {

        completedAt: new Date(),

        ...(situationId ? { situationId } : {}),

      },

      include: activityInclude,

    });

    return this.mapActivity(activity);

  }



  async remove(id: string, companyId: string) {

    await this.findOne(id, companyId);

    await this.prisma.crmActivity.delete({ where: { id } });

    return { message: 'Actividad eliminada' };

  }



  private mapActivity(activity: {

    id: string;

    type: string;

    subject: string;

    description: string | null;

    dueAt: Date | null;

    completedAt: Date | null;

    taskTypeId: string | null;

    subjectCatalogId: string | null;

    situationId: string | null;

    agendaClassificationId: string | null;

    leadId: string | null;

    opportunityId: string | null;

    clientId: string | null;

    createdAt: Date;

    updatedAt: Date;

    lead?: { id: string; name: string } | null;

    opportunity?: { id: string; title: string } | null;

    client?: { id: string; name: string } | null;

    assignedTo?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;

    createdBy?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;

    taskTypeCatalog?: { id: string; name: string; code: string | null; color: string | null } | null;

    subjectCatalog?: { id: string; name: string; code: string | null; color: string | null } | null;

    situationCatalog?: { id: string; name: string; code: string | null; color: string | null } | null;

    agendaClassification?: { id: string; name: string; code: string | null; color: string | null } | null;

  }) {

    return {

      id: activity.id,

      type: activity.type,

      taskTypeId: activity.taskTypeId,

      taskTypeCatalog: this.catalogs.mapCatalogRef(activity.taskTypeCatalog),

      subject: activity.subject,

      subjectCatalogId: activity.subjectCatalogId,

      subjectCatalog: this.catalogs.mapCatalogRef(activity.subjectCatalog),

      situationId: activity.situationId,

      situationCatalog: this.catalogs.mapCatalogRef(activity.situationCatalog),

      agendaClassificationId: activity.agendaClassificationId,

      agendaClassification: this.catalogs.mapCatalogRef(activity.agendaClassification),

      description: activity.description,

      dueAt: activity.dueAt?.toISOString() ?? null,

      completedAt: activity.completedAt?.toISOString() ?? null,

      leadId: activity.leadId,

      lead: activity.lead,

      opportunityId: activity.opportunityId,

      opportunity: activity.opportunity,

      clientId: activity.clientId,

      client: activity.client,

      assignedTo: mapUser(activity.assignedTo),

      createdBy: mapUser(activity.createdBy),

      createdAt: activity.createdAt.toISOString(),

      updatedAt: activity.updatedAt.toISOString(),

    };

  }

}


