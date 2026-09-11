import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { CrmStagesService } from './crm-stages.service';
import {
  ConvertOpportunityToQuoteDto,
  CreateCrmOpportunityDto,
  MoveCrmOpportunityStageDto,
  QueryCrmOpportunitiesDto,
  UpdateCrmOpportunityDto,
} from './dto/crm-opportunity.dto';
import { mapUser } from './crm.mapper';

const opportunityInclude = {
  stage: true,
  client: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  quote: { select: { id: true, number: true, status: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

@Injectable()
export class CrmOpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stages: CrmStagesService,
    private readonly quotes: QuotesService,
  ) {}

  async getPipeline(companyId: string) {
    await this.stages.ensureDefaultStages(companyId);
    const stages = await this.stages.listStages(companyId);
    const opportunities = await this.prisma.crmOpportunity.findMany({
      where: { companyId, status: 'open' },
      include: opportunityInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        sortOrder: s.sortOrder,
        color: s.color,
        isClosed: s.isClosed,
        outcome: s.outcome,
        opportunities: opportunities
          .filter((o) => o.stageId === s.id)
          .map((o) => this.mapOpportunity(o)),
      })),
      summary: {
        totalOpen: opportunities.length,
        totalValue: opportunities.reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
      },
    };
  }

  async findAll(companyId: string, query: QueryCrmOpportunitiesDto) {
    const items = await this.prisma.crmOpportunity.findMany({
      where: {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.stageId ? { stageId: query.stageId } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' as const } },
                { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      include: opportunityInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return items.map((o) => this.mapOpportunity(o));
  }

  async findOne(id: string, companyId: string) {
    const opp = await this.prisma.crmOpportunity.findFirst({
      where: { id, companyId },
      include: opportunityInclude,
    });
    if (!opp) throw new NotFoundException('Oportunidad no encontrada');
    return this.mapOpportunity(opp);
  }

  async create(companyId: string, dto: CreateCrmOpportunityDto) {
    let stageId = dto.stageId;
    if (!stageId) {
      const stage = await this.stages.getFirstOpenStage(companyId);
      if (!stage) throw new BadRequestException('Pipeline CRM no configurado');
      stageId = stage.id;
    } else {
      const stage = await this.stages.getStageById(companyId, stageId);
      if (!stage) throw new BadRequestException('Etapa no válida');
    }

    const opp = await this.prisma.crmOpportunity.create({
      data: {
        companyId,
        title: dto.title,
        stageId,
        clientId: dto.clientId,
        leadId: dto.leadId,
        amount: dto.amount,
        probability: dto.probability ?? 50,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        assignedToId: dto.assignedToId,
      },
      include: opportunityInclude,
    });

    return this.mapOpportunity(opp);
  }

  async update(id: string, companyId: string, dto: UpdateCrmOpportunityDto) {
    await this.findOne(id, companyId);

    const data: Record<string, unknown> = {
      title: dto.title,
      clientId: dto.clientId,
      amount: dto.amount,
      probability: dto.probability,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      notes: dto.notes,
      assignedToId: dto.assignedToId,
    };

    if (dto.stageId) {
      const stage = await this.stages.getStageById(companyId, dto.stageId);
      if (!stage) throw new BadRequestException('Etapa no válida');
      data.stageId = dto.stageId;
      data.status = stage.outcome === 'won' ? 'won' : stage.outcome === 'lost' ? 'lost' : 'open';
      data.lostReason = stage.outcome === 'lost' ? dto.lostReason ?? null : null;
    } else if (dto.status) {
      data.status = dto.status;
      data.lostReason = dto.lostReason;
    }

    const opp = await this.prisma.crmOpportunity.update({
      where: { id },
      data,
      include: opportunityInclude,
    });

    return this.mapOpportunity(opp);
  }

  async moveStage(id: string, companyId: string, dto: MoveCrmOpportunityStageDto) {
    await this.applyStageChange(companyId, id, dto.stageId);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.crmOpportunity.delete({ where: { id } });
    return { message: 'Oportunidad eliminada' };
  }

  async convertToQuote(id: string, companyId: string, dto: ConvertOpportunityToQuoteDto) {
    const opp = await this.prisma.crmOpportunity.findFirst({
      where: { id, companyId },
      include: { stage: true },
    });
    if (!opp) throw new NotFoundException('Oportunidad no encontrada');
    if (!opp.clientId) {
      throw new BadRequestException('La oportunidad necesita un cliente vinculado');
    }
    if (opp.quoteId) {
      throw new BadRequestException('Esta oportunidad ya tiene un presupuesto');
    }

    const amount = Number(opp.amount ?? 0);
    const lines = dto.lines?.length
      ? dto.lines
      : [{ description: opp.title, quantity: 1, unitPrice: amount > 0 ? amount : 0 }];

    if (lines.every((l) => Number(l.unitPrice) <= 0 && Number(l.quantity) <= 0)) {
      throw new BadRequestException('Indica un importe o líneas para el presupuesto');
    }

    const quote = await this.quotes.create(companyId, {
      clientId: opp.clientId,
      status: 'draft',
      notes: dto.notes ?? `Generado desde oportunidad: ${opp.title}`,
      taxRate: dto.taxRate,
      lines,
    });

    const proposalStage = await this.stages.getProposalStage(companyId);

    await this.prisma.crmOpportunity.update({
      where: { id },
      data: {
        quoteId: quote.id,
        ...(proposalStage && !proposalStage.isClosed ? { stageId: proposalStage.id } : {}),
      },
    });

    return {
      quote: { id: quote.id, number: quote.number, total: Number(quote.total) },
      opportunityId: id,
    };
  }

  private async applyStageChange(
    companyId: string,
    opportunityId: string,
    stageId: string,
    lostReason?: string,
  ) {
    const stage = await this.stages.getStageById(companyId, stageId);
    if (!stage) throw new BadRequestException('Etapa no válida');

    const status = stage.outcome === 'won' ? 'won' : stage.outcome === 'lost' ? 'lost' : 'open';

    await this.prisma.crmOpportunity.update({
      where: { id: opportunityId },
      data: {
        stageId,
        status,
        lostReason: stage.outcome === 'lost' ? lostReason : null,
      },
    });
  }

  private mapOpportunity(opp: {
    id: string;
    title: string;
    stageId: string;
    clientId: string | null;
    leadId: string | null;
    amount: { toNumber?: () => number } | number | string | null;
    probability: number;
    expectedCloseDate: Date | null;
    status: string;
    lostReason: string | null;
    quoteId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    stage?: { id: string; name: string; color: string; isClosed: boolean; outcome: string | null };
    client?: { id: string; name: string } | null;
    lead?: { id: string; name: string } | null;
    quote?: { id: string; number: string; status: string } | null;
    assignedTo?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  }) {
    return {
      id: opp.id,
      title: opp.title,
      stageId: opp.stageId,
      stage: opp.stage,
      clientId: opp.clientId,
      client: opp.client,
      leadId: opp.leadId,
      lead: opp.lead,
      amount: opp.amount != null ? Number(opp.amount) : null,
      probability: opp.probability,
      expectedCloseDate: opp.expectedCloseDate?.toISOString().slice(0, 10) ?? null,
      status: opp.status,
      lostReason: opp.lostReason,
      quoteId: opp.quoteId,
      quote: opp.quote,
      notes: opp.notes,
      assignedTo: mapUser(opp.assignedTo),
      createdAt: opp.createdAt.toISOString(),
      updatedAt: opp.updatedAt.toISOString(),
    };
  }
}
