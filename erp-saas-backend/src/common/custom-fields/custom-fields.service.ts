import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const ALLOWED_ENTITY_TYPES = new Set([
  'clients',
  'products',
  'suppliers',
  'employees',
  'orders',
  'invoices',
  'quotes',
  'purchaseOrders',
  'categories',
  'warehouses',
]);

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  assertEntityType(entityType: string) {
    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      throw new Error(`Tipo de entidad no válido: ${entityType}`);
    }
  }

  async getValues(companyId: string, entityType: string, entityId: string) {
    this.assertEntityType(entityType);
    const row = await this.prisma.entityCustomFieldData.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
    if (!row || row.companyId !== companyId) {
      return { values: {} as Record<string, unknown> };
    }
    return { values: (row.values as Record<string, unknown>) ?? {} };
  }

  async saveValues(
    companyId: string,
    entityType: string,
    entityId: string,
    values: Record<string, unknown>,
  ) {
    this.assertEntityType(entityType);
    const sanitized = Object.fromEntries(
      Object.entries(values).filter(([key]) => key.startsWith('cf_')),
    );

    await this.prisma.entityCustomFieldData.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      update: { values: sanitized as object, companyId },
      create: { entityType, entityId, companyId, values: sanitized as object },
    });

    return { values: sanitized };
  }

  async deleteValues(companyId: string, entityType: string, entityId: string) {
    this.assertEntityType(entityType);
    await this.prisma.entityCustomFieldData.deleteMany({
      where: { entityType, entityId, companyId },
    });
    return { message: 'Valores eliminados' };
  }
}
