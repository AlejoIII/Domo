import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { PGCE_DEFAULT_ACCOUNTS } from './pgce-defaults';

@Injectable()
export class AccountingChartService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultChart(companyId: string) {
    const count = await this.prisma.account.count({ where: { companyId } });
    if (count > 0) return;

    await this.prisma.account.createMany({
      data: PGCE_DEFAULT_ACCOUNTS.map((a) => ({
        companyId,
        code: a.code,
        name: a.name,
        type: a.type,
        isSystem: true,
      })),
    });
  }

  async listAccounts(companyId: string) {
    await this.ensureDefaultChart(companyId);
    return this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getAccountByCode(companyId: string, code: string) {
    await this.ensureDefaultChart(companyId);
    return this.prisma.account.findFirst({
      where: { companyId, code, isActive: true },
    });
  }
}
