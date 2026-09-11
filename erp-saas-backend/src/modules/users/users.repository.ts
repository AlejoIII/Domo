import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
  }
}
