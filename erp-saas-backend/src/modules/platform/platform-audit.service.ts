import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class PlatformAuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.platformAuditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  list(limit = 50) {
    return this.prisma.platformAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
