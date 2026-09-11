import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';

import { DEFAULT_CRM_STAGES } from './crm-default-stages';

import {

  CreateCrmStageDto,

  ReorderCrmStagesDto,

  UpdateCrmStageDto,

} from './dto/crm-stage.dto';



@Injectable()

export class CrmStagesService {

  constructor(private readonly prisma: PrismaService) {}



  async ensureDefaultStages(companyId: string) {

    const count = await this.prisma.crmStage.count({ where: { companyId } });

    if (count > 0) return;



    await this.prisma.crmStage.createMany({

      data: DEFAULT_CRM_STAGES.map((s) => ({

        companyId,

        name: s.name,

        sortOrder: s.sortOrder,

        color: s.color,

        isClosed: s.isClosed,

        outcome: s.outcome,

      })),

    });

  }



  async listStages(companyId: string) {

    await this.ensureDefaultStages(companyId);

    return this.prisma.crmStage.findMany({

      where: { companyId },

      orderBy: { sortOrder: 'asc' },

      include: {

        _count: { select: { opportunities: true } },

      },

    });

  }



  async getStageById(companyId: string, stageId: string) {

    await this.ensureDefaultStages(companyId);

    return this.prisma.crmStage.findFirst({ where: { id: stageId, companyId } });

  }



  async getFirstOpenStage(companyId: string) {

    await this.ensureDefaultStages(companyId);

    return this.prisma.crmStage.findFirst({

      where: { companyId, isClosed: false },

      orderBy: { sortOrder: 'asc' },

    });

  }



  async getProposalStage(companyId: string) {

    await this.ensureDefaultStages(companyId);

    return this.prisma.crmStage.findFirst({

      where: { companyId, name: 'Propuesta' },

    });

  }



  async createStage(companyId: string, dto: CreateCrmStageDto) {

    await this.ensureDefaultStages(companyId);



    const maxOrder = await this.prisma.crmStage.aggregate({

      where: { companyId },

      _max: { sortOrder: true },

    });



    const isClosed = dto.isClosed ?? false;

    const outcome = isClosed ? (dto.outcome ?? null) : null;



    return this.prisma.crmStage.create({

      data: {

        companyId,

        name: dto.name.trim(),

        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,

        color: dto.color ?? '#6366f1',

        isClosed,

        outcome,

      },

    });

  }



  async updateStage(companyId: string, stageId: string, dto: UpdateCrmStageDto) {

    const stage = await this.getStageById(companyId, stageId);

    if (!stage) throw new NotFoundException('Etapa no encontrada');



    const isClosed = dto.isClosed ?? stage.isClosed;

    const outcome = isClosed

      ? (dto.outcome !== undefined ? dto.outcome : stage.outcome)

      : null;



    const updated = await this.prisma.crmStage.update({

      where: { id: stageId },

      data: {

        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),

        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),

        ...(dto.color !== undefined ? { color: dto.color } : {}),

        isClosed,

        outcome,

      },

    });



    if (isClosed && outcome) {

      await this.prisma.crmOpportunity.updateMany({

        where: { companyId, stageId, status: 'open' },

        data: { status: outcome },

      });

    }



    return updated;

  }



  async reorderStages(companyId: string, dto: ReorderCrmStagesDto) {

    await this.ensureDefaultStages(companyId);



    const ids = dto.stages.map((s) => s.id);

    const existing = await this.prisma.crmStage.findMany({

      where: { companyId, id: { in: ids } },

      select: { id: true },

    });



    if (existing.length !== ids.length) {

      throw new BadRequestException('Una o más etapas no existen');

    }



    await this.prisma.$transaction(

      dto.stages.map((item) =>

        this.prisma.crmStage.update({

          where: { id: item.id },

          data: { sortOrder: item.sortOrder },

        }),

      ),

    );



    return this.listStages(companyId);

  }



  async removeStage(companyId: string, stageId: string, moveToStageId?: string) {

    const stage = await this.getStageById(companyId, stageId);

    if (!stage) throw new NotFoundException('Etapa no encontrada');



    const oppCount = await this.prisma.crmOpportunity.count({

      where: { companyId, stageId },

    });



    if (oppCount > 0) {

      const targetId = moveToStageId ?? (await this.getFirstOpenStage(companyId))?.id;

      if (!targetId || targetId === stageId) {

        throw new BadRequestException(

          'La etapa tiene oportunidades. Indica otra etapa destino o muévelas antes de eliminar.',

        );

      }



      const target = await this.getStageById(companyId, targetId);

      if (!target) throw new NotFoundException('Etapa destino no encontrada');



      await this.prisma.crmOpportunity.updateMany({

        where: { companyId, stageId },

        data: { stageId: targetId },

      });

    }



    await this.prisma.crmStage.delete({ where: { id: stageId } });

    return { message: 'Etapa eliminada' };

  }

}


