import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { assertAllowedAttachmentMeta } from '../../common/uploads/upload.config';
import { StorageService } from '../../common/storage/storage.service';import { CreateAttachmentDto } from './dto/attachment.dto';
import {
  assertAttachmentPermission,
  AttachmentAccessUser,
  AttachmentEntityType,
} from './attachment-entities.constants';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}
  findByEntity(companyId: string, entityType: AttachmentEntityType, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { companyId, entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    companyId: string,
    userId: string,
    user: AttachmentAccessUser,
    dto: CreateAttachmentDto,
  ) {
    this.checkPermission(user, dto.entityType, 'write');
    assertAllowedAttachmentMeta(dto.mimeType, dto.size, dto.fileName);
    await this.assertEntity(companyId, dto.entityType, dto.entityId);
    return this.prisma.attachment.create({
      data: {
        companyId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        size: dto.size,
        uploadedBy: userId,
      },
    });
  }

  async remove(id: string, companyId: string, user: AttachmentAccessUser) {
    const item = await this.prisma.attachment.findFirst({ where: { id, companyId } });
    if (!item) throw new NotFoundException('Adjunto no encontrado');
    this.checkPermission(user, item.entityType as AttachmentEntityType, 'write');
    await this.prisma.attachment.delete({ where: { id } });
    await this.removeStoredFile(item.fileUrl);
    return { message: 'Adjunto eliminado' };
  }

  private async removeStoredFile(fileUrl: string) {
    await this.storage.deleteByPath(fileUrl);
  }
  checkPermission(
    user: AttachmentAccessUser | undefined,
    entityType: AttachmentEntityType,
    action: 'read' | 'write',
  ) {
    try {
      assertAttachmentPermission(user, entityType, action);
    } catch {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
  }

  private async assertEntity(
    companyId: string,
    entityType: AttachmentEntityType,
    entityId: string,
  ) {
    const where = { id: entityId, companyId, deletedAt: null as Date | null };

    switch (entityType) {
      case 'client': {
        const row = await this.prisma.client.findFirst({ where });
        if (!row) throw new NotFoundException('Cliente no encontrado');
        return;
      }
      case 'invoice': {
        const row = await this.prisma.invoice.findFirst({ where });
        if (!row) throw new NotFoundException('Factura no encontrada');
        return;
      }
      case 'order': {
        const row = await this.prisma.salesOrder.findFirst({ where });
        if (!row) throw new NotFoundException('Pedido no encontrado');
        return;
      }
      case 'quote': {
        const row = await this.prisma.quote.findFirst({ where });
        if (!row) throw new NotFoundException('Presupuesto no encontrado');
        return;
      }
      case 'purchase_order': {
        const row = await this.prisma.purchaseOrder.findFirst({ where });
        if (!row) throw new NotFoundException('Orden de compra no encontrada');
        return;
      }
      case 'product': {
        const row = await this.prisma.product.findFirst({ where });
        if (!row) throw new NotFoundException('Producto no encontrado');
        return;
      }
      case 'supplier': {
        const row = await this.prisma.supplier.findFirst({ where });
        if (!row) throw new NotFoundException('Proveedor no encontrado');
        return;
      }
      default:
        throw new NotFoundException('Entidad no encontrada');
    }
  }
}
