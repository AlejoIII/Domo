import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, companyId: string, dto: CreateFeedbackDto) {
    const row = await this.prisma.betaFeedback.create({
      data: {
        userId,
        companyId,
        message: dto.message.trim(),
        rating: dto.rating ?? null,
        page: dto.page?.trim() || null,
      },
    });

    return {
      id: row.id,
      message: 'Gracias por tu feedback',
      createdAt: row.createdAt.toISOString(),
    };
  }

  list(limit = 50) {
    return this.prisma.betaFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: {
        company: { select: { id: true, name: true, betaCohort: true } },
      },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        message: row.message,
        page: row.page,
        userId: row.userId,
        createdAt: row.createdAt.toISOString(),
        company: row.company,
      })),
    );
  }
}
