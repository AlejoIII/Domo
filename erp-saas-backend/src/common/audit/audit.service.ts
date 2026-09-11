import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly queue?: QueueService,
  ) {}

  logAsync(params: {
    action: string;
    companyId: string;
    userId?: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (this.queue) {
      this.queue.enqueueAudit(params);
      return;
    }
    void this.log(params).catch(() => undefined);
  }

  log(params: {
    action: string;
    companyId: string;
    userId?: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: params.action,
        companyId: params.companyId,
        userId: params.userId,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAll(companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where: { companyId } }),
    ]);
  }
}
