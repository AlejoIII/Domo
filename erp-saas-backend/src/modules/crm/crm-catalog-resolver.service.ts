import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CrmCatalogCategory } from './crm-config.constants';
import { CrmConfigService } from './crm-config.service';

export type CatalogRef = {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
};

const catalogSelect = {
  id: true,
  name: true,
  code: true,
  color: true,
} as const;

@Injectable()
export class CrmCatalogResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: CrmConfigService,
  ) {}

  async resolveLeadStatus(
    companyId: string,
    input: { statusId?: string; status?: string },
  ) {
    await this.config.listCatalog(companyId, 'status');

    if (input.statusId) {
      const item = await this.requireCatalogItem(companyId, input.statusId, 'status');
      return {
        statusId: item.id,
        status: this.catalogCode(item),
      };
    }

    if (input.status) {
      const item = await this.findByCode(companyId, 'status', input.status);
      return {
        statusId: item?.id ?? null,
        status: input.status,
      };
    }

    const item = await this.defaultCatalogItem(companyId, 'status');
    return {
      statusId: item.id,
      status: this.catalogCode(item),
    };
  }

  async resolveActivityTaskType(
    companyId: string,
    input: { taskTypeId?: string; type?: string },
  ) {
    await this.config.listCatalog(companyId, 'task_type');

    if (input.taskTypeId) {
      const item = await this.requireCatalogItem(companyId, input.taskTypeId, 'task_type');
      return {
        taskTypeId: item.id,
        type: this.catalogCode(item),
      };
    }

    if (input.type) {
      const item = await this.findByCode(companyId, 'task_type', input.type);
      return {
        taskTypeId: item?.id ?? null,
        type: input.type,
      };
    }

    const item = await this.defaultCatalogItem(companyId, 'task_type');
    return {
      taskTypeId: item.id,
      type: this.catalogCode(item),
    };
  }

  async resolveOptionalCatalogId(
    companyId: string,
    category: CrmCatalogCategory,
    catalogId?: string,
  ) {
    if (!catalogId) return null;
    const item = await this.requireCatalogItem(companyId, catalogId, category);
    return item.id;
  }

  async resolveActivitySubject(
    companyId: string,
    input: { subject: string; subjectCatalogId?: string },
  ) {
    let subject = input.subject.trim();
    let subjectCatalogId: string | null = null;

    if (input.subjectCatalogId) {
      const item = await this.requireCatalogItem(companyId, input.subjectCatalogId, 'subject');
      subjectCatalogId = item.id;
      if (!subject) {
        subject = item.name;
      }
    }

    if (!subject) {
      throw new BadRequestException('El asunto es obligatorio');
    }

    return { subject, subjectCatalogId };
  }

  mapCatalogRef(
    item: { id: string; name: string; code: string | null; color: string | null } | null | undefined,
  ): CatalogRef | null {
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      code: item.code,
      color: item.color,
    };
  }

  private catalogCode(item: { code: string | null; name: string }) {
    return item.code ?? item.name.toLowerCase().replace(/\s+/g, '_');
  }

  private async requireCatalogItem(
    companyId: string,
    id: string,
    category: CrmCatalogCategory,
  ) {
    const item = await this.prisma.crmCatalogItem.findFirst({
      where: { id, companyId, category, isActive: true },
      select: catalogSelect,
    });
    if (!item) {
      throw new BadRequestException(`Valor de catálogo CRM no válido (${category})`);
    }
    return item;
  }

  private async findByCode(companyId: string, category: CrmCatalogCategory, code: string) {
    return this.prisma.crmCatalogItem.findFirst({
      where: {
        companyId,
        category,
        isActive: true,
        OR: [{ code }, { name: { equals: code, mode: 'insensitive' } }],
      },
      select: catalogSelect,
    });
  }

  private async defaultCatalogItem(companyId: string, category: CrmCatalogCategory) {
    const item = await this.prisma.crmCatalogItem.findFirst({
      where: { companyId, category, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: catalogSelect,
    });
    if (!item) {
      throw new BadRequestException(`Catálogo CRM "${category}" no configurado`);
    }
    return item;
  }
}
