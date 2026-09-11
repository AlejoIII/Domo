import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CrmCatalogCategory,
  isCrmCatalogCategory,
} from './crm-config.constants';
import { DEFAULT_CRM_CATALOGS } from './crm-default-catalogs';
import {
  CreateCrmAcreliaAccountDto,
  CreateCrmCatalogItemDto,
  CreateCrmEmailTemplateDto,
  CreateCrmSmsTemplateDto,
  UpdateCrmAcreliaAccountDto,
  UpdateCrmCatalogItemDto,
  UpdateCrmEmailSettingsDto,
  UpdateCrmEmailTemplateDto,
  UpdateCrmSmsTemplateDto,
} from './dto/crm-config.dto';

@Injectable()
export class CrmConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async listCatalog(companyId: string, category: string, search?: string) {
    this.assertCatalogCategory(category);
    await this.ensureDefaultCatalog(companyId, category);

    const term = search?.trim();
    return this.prisma.crmCatalogItem.findMany({
      where: {
        companyId,
        category,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' as const } },
                { code: { contains: term, mode: 'insensitive' as const } },
                { description: { contains: term, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createCatalogItem(
    companyId: string,
    category: string,
    dto: CreateCrmCatalogItemDto,
  ) {
    this.assertCatalogCategory(category);
    await this.ensureDefaultCatalog(companyId, category);

    const sortOrder = dto.sortOrder ?? (await this.nextCatalogSortOrder(companyId, category));

    return this.prisma.crmCatalogItem.create({
      data: {
        companyId,
        category,
        name: dto.name.trim(),
        code: dto.code?.trim() || null,
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || null,
        sortOrder,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCatalogItem(
    id: string,
    companyId: string,
    category: string,
    dto: UpdateCrmCatalogItemDto,
  ) {
    this.assertCatalogCategory(category);
    await this.findCatalogItem(id, companyId, category);

    return this.prisma.crmCatalogItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.color !== undefined ? { color: dto.color?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async removeCatalogItem(id: string, companyId: string, category: string) {
    this.assertCatalogCategory(category);
    await this.findCatalogItem(id, companyId, category);
    await this.prisma.crmCatalogItem.delete({ where: { id } });
    return { message: 'Elemento eliminado' };
  }

  listEmailTemplates(companyId: string) {
    return this.prisma.crmEmailTemplate.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createEmailTemplate(companyId: string, dto: CreateCrmEmailTemplateDto) {
    if (dto.isDefault) {
      await this.clearDefaultEmailTemplate(companyId);
    }

    return this.prisma.crmEmailTemplate.create({
      data: {
        companyId,
        name: dto.name.trim(),
        subject: dto.subject.trim(),
        bodyHtml: dto.bodyHtml,
        bodyText: dto.bodyText?.trim() || null,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateEmailTemplate(
    id: string,
    companyId: string,
    dto: UpdateCrmEmailTemplateDto,
  ) {
    await this.findEmailTemplate(id, companyId);

    if (dto.isDefault) {
      await this.clearDefaultEmailTemplate(companyId, id);
    }

    return this.prisma.crmEmailTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.bodyHtml !== undefined ? { bodyHtml: dto.bodyHtml } : {}),
        ...(dto.bodyText !== undefined ? { bodyText: dto.bodyText?.trim() || null } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async removeEmailTemplate(id: string, companyId: string) {
    await this.findEmailTemplate(id, companyId);
    await this.prisma.crmEmailTemplate.delete({ where: { id } });
    return { message: 'Plantilla de email eliminada' };
  }

  listSmsTemplates(companyId: string) {
    return this.prisma.crmSmsTemplate.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createSmsTemplate(companyId: string, dto: CreateCrmSmsTemplateDto) {
    if (dto.isDefault) {
      await this.clearDefaultSmsTemplate(companyId);
    }

    return this.prisma.crmSmsTemplate.create({
      data: {
        companyId,
        name: dto.name.trim(),
        body: dto.body.trim(),
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSmsTemplate(id: string, companyId: string, dto: UpdateCrmSmsTemplateDto) {
    await this.findSmsTemplate(id, companyId);

    if (dto.isDefault) {
      await this.clearDefaultSmsTemplate(companyId, id);
    }

    return this.prisma.crmSmsTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async removeSmsTemplate(id: string, companyId: string) {
    await this.findSmsTemplate(id, companyId);
    await this.prisma.crmSmsTemplate.delete({ where: { id } });
    return { message: 'Plantilla SMS eliminada' };
  }

  async getEmailSettings(companyId: string) {
    let settings = await this.prisma.crmEmailSettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await this.prisma.crmEmailSettings.create({
        data: { companyId },
      });
    }

    return settings;
  }

  async updateEmailSettings(companyId: string, dto: UpdateCrmEmailSettingsDto) {
    await this.getEmailSettings(companyId);

    if (dto.defaultEmailTemplateId) {
      await this.findEmailTemplate(dto.defaultEmailTemplateId, companyId);
    }

    return this.prisma.crmEmailSettings.update({
      where: { companyId },
      data: {
        ...(dto.fromName !== undefined ? { fromName: dto.fromName?.trim() || null } : {}),
        ...(dto.fromEmail !== undefined ? { fromEmail: dto.fromEmail?.trim() || null } : {}),
        ...(dto.replyTo !== undefined ? { replyTo: dto.replyTo?.trim() || null } : {}),
        ...(dto.signatureHtml !== undefined ? { signatureHtml: dto.signatureHtml || null } : {}),
        ...(dto.copyTo !== undefined ? { copyTo: dto.copyTo?.trim() || null } : {}),
        ...(dto.defaultEmailTemplateId !== undefined
          ? { defaultEmailTemplateId: dto.defaultEmailTemplateId || null }
          : {}),
      },
    });
  }

  listAcreliaAccounts(companyId: string) {
    return this.prisma.crmAcreliaAccount.findMany({
      where: { companyId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        companyId: true,
        name: true,
        senderId: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        apiKey: true,
      },
    }).then((items) =>
      items.map((item) => ({
        ...item,
        apiKey: item.apiKey ? '••••••••' : null,
        hasApiKey: Boolean(item.apiKey),
      })),
    );
  }

  createAcreliaAccount(companyId: string, dto: CreateCrmAcreliaAccountDto) {
    return this.prisma.crmAcreliaAccount.create({
      data: {
        companyId,
        name: dto.name.trim(),
        apiKey: dto.apiKey?.trim() || null,
        senderId: dto.senderId?.trim() || null,
        isActive: dto.isActive ?? true,
        notes: dto.notes?.trim() || null,
      },
      select: this.acreliaPublicSelect(),
    }).then((item) => ({
      ...item,
      apiKey: item.apiKey ? '••••••••' : null,
      hasApiKey: Boolean(item.apiKey),
    }));
  }

  async updateAcreliaAccount(
    id: string,
    companyId: string,
    dto: UpdateCrmAcreliaAccountDto,
  ) {
    await this.findAcreliaAccount(id, companyId);

    const updated = await this.prisma.crmAcreliaAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.apiKey !== undefined ? { apiKey: dto.apiKey?.trim() || null } : {}),
        ...(dto.senderId !== undefined ? { senderId: dto.senderId?.trim() || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
      select: this.acreliaPublicSelect(),
    });

    return {
      ...updated,
      apiKey: updated.apiKey ? '••••••••' : null,
      hasApiKey: Boolean(updated.apiKey),
    };
  }

  async removeAcreliaAccount(id: string, companyId: string) {
    await this.findAcreliaAccount(id, companyId);
    await this.prisma.crmAcreliaAccount.delete({ where: { id } });
    return { message: 'Cuenta Acrelia eliminada' };
  }

  private assertCatalogCategory(category: string): asserts category is CrmCatalogCategory {
    if (!isCrmCatalogCategory(category)) {
      throw new BadRequestException('Categoría de catálogo CRM no válida');
    }
  }

  private async ensureDefaultCatalog(companyId: string, category: CrmCatalogCategory) {
    const count = await this.prisma.crmCatalogItem.count({
      where: { companyId, category },
    });
    if (count > 0) return;

    const defaults = DEFAULT_CRM_CATALOGS[category];
    await this.prisma.crmCatalogItem.createMany({
      data: defaults.map((item) => ({
        companyId,
        category,
        name: item.name,
        code: item.code ?? null,
        color: item.color ?? null,
        sortOrder: item.sortOrder,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  private async nextCatalogSortOrder(companyId: string, category: string) {
    const last = await this.prisma.crmCatalogItem.findFirst({
      where: { companyId, category },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return (last?.sortOrder ?? 0) + 1;
  }

  private async findCatalogItem(id: string, companyId: string, category: string) {
    const item = await this.prisma.crmCatalogItem.findFirst({
      where: { id, companyId, category },
    });
    if (!item) throw new NotFoundException('Elemento de catálogo no encontrado');
    return item;
  }

  private async findEmailTemplate(id: string, companyId: string) {
    const item = await this.prisma.crmEmailTemplate.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException('Plantilla de email no encontrada');
    return item;
  }

  private async findSmsTemplate(id: string, companyId: string) {
    const item = await this.prisma.crmSmsTemplate.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException('Plantilla SMS no encontrada');
    return item;
  }

  private async findAcreliaAccount(id: string, companyId: string) {
    const item = await this.prisma.crmAcreliaAccount.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException('Cuenta Acrelia no encontrada');
    return item;
  }

  private async clearDefaultEmailTemplate(companyId: string, exceptId?: string) {
    await this.prisma.crmEmailTemplate.updateMany({
      where: {
        companyId,
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  private async clearDefaultSmsTemplate(companyId: string, exceptId?: string) {
    await this.prisma.crmSmsTemplate.updateMany({
      where: {
        companyId,
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  private acreliaPublicSelect() {
    return {
      id: true,
      companyId: true,
      name: true,
      apiKey: true,
      senderId: true,
      isActive: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
