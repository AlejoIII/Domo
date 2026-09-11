import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';

@Injectable()
export class TreasuryAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return Promise.all(accounts.map((acc) => this.mapAccount(companyId, acc)));
  }

  async findOne(id: string, companyId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id, companyId },
    });
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return this.mapAccount(companyId, account);
  }

  create(companyId: string, dto: CreateBankAccountDto) {
    return this.prisma.bankAccount
      .create({
        data: {
          companyId,
          name: dto.name,
          iban: dto.iban,
          bankName: dto.bankName,
          currency: dto.currency ?? 'EUR',
          openingBalance: dto.openingBalance ?? 0,
          notes: dto.notes,
        },
      })
      .then((acc) => this.mapAccount(companyId, acc));
  }

  async update(id: string, companyId: string, dto: UpdateBankAccountDto) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data: {
        name: dto.name,
        iban: dto.iban,
        bankName: dto.bankName,
        currency: dto.currency,
        openingBalance: dto.openingBalance,
        isActive: dto.isActive,
        notes: dto.notes,
      },
    });
    return this.mapAccount(companyId, updated);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.bankAccount.delete({ where: { id } });
    return { message: 'Cuenta bancaria eliminada' };
  }

  async computeBalance(companyId: string, bankAccountId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
    });
    if (!account) return 0;

    const movements = await this.prisma.bankMovement.groupBy({
      by: ['type'],
      where: { bankAccountId, companyId },
      _sum: { amount: true },
    });

    let inTotal = 0;
    let outTotal = 0;
    for (const row of movements) {
      const sum = Number(row._sum.amount ?? 0);
      if (row.type === 'in') inTotal = sum;
      else outTotal = sum;
    }

    return Number(account.openingBalance) + inTotal - outTotal;
  }

  private async mapAccount(
    companyId: string,
    account: {
      id: string;
      companyId: string;
      name: string;
      iban: string | null;
      bankName: string | null;
      currency: string;
      openingBalance: { toNumber?: () => number } | number | string;
      isActive: boolean;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    const currentBalance = await this.computeBalance(companyId, account.id);
    return {
      id: account.id,
      name: account.name,
      iban: account.iban,
      bankName: account.bankName,
      currency: account.currency,
      openingBalance: Number(account.openingBalance),
      currentBalance,
      isActive: account.isActive,
      notes: account.notes,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
