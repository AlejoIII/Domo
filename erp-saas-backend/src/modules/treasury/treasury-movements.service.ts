import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateBankMovementDto, ImportBankMovementsDto } from './dto/bank-movement.dto';
import { QueryBankMovementsDto } from './dto/query-bank-movements.dto';
import { TreasuryAccountsService } from './treasury-accounts.service';

@Injectable()
export class TreasuryMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: TreasuryAccountsService,
  ) {}

  async findAll(companyId: string, query: QueryBankMovementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const where = this.buildWhere(companyId, query);

    const [items, total] = await Promise.all([
      this.prisma.bankMovement.findMany({
        where,
        orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          bankAccount: { select: { id: true, name: true } },
          payment: {
            select: {
              id: true,
              amount: true,
              invoice: { select: { id: true, number: true } },
            },
          },
        },
      }),
      this.prisma.bankMovement.count({ where }),
    ]);

    return {
      items: items.map((m) => this.mapMovement(m)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(companyId: string, dto: CreateBankMovementDto, userId?: string) {
    await this.accounts.findOne(dto.bankAccountId, companyId);

    const movement = await this.prisma.bankMovement.create({
      data: {
        companyId,
        bankAccountId: dto.bankAccountId,
        movementDate: new Date(dto.movementDate),
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        reference: dto.reference,
        createdBy: userId,
      },
      include: {
        bankAccount: { select: { id: true, name: true } },
        payment: {
          select: {
            id: true,
            amount: true,
            invoice: { select: { id: true, number: true } },
          },
        },
      },
    });

    return this.mapMovement(movement);
  }

  async importCsv(companyId: string, dto: ImportBankMovementsDto, userId?: string) {
    await this.accounts.findOne(dto.bankAccountId, companyId);

    const rows = this.parseCsv(dto.csv);
    if (rows.length === 0) {
      throw new BadRequestException('El CSV no contiene filas válidas');
    }

    const batchId = randomUUID();
    const created = await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.bankMovement.create({
          data: {
            companyId,
            bankAccountId: dto.bankAccountId,
            movementDate: row.movementDate,
            description: row.description,
            amount: row.amount,
            type: row.type,
            reference: row.reference,
            importBatchId: batchId,
            createdBy: userId,
          },
        }),
      ),
    );

    return {
      importBatchId: batchId,
      imported: created.length,
      message: `${created.length} movimientos importados`,
    };
  }

  private buildWhere(companyId: string, query: QueryBankMovementsDto) {
    const where: Record<string, unknown> = { companyId };
    if (query.bankAccountId) where.bankAccountId = query.bankAccountId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      const movementDate: { gte?: Date; lte?: Date } = {};
      if (query.from) movementDate.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        movementDate.lte = end;
      }
      where.movementDate = movementDate;
    }
    return where;
  }

  private parseCsv(csv: string) {
    const lines = csv
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    let startIndex = 0;
    const firstCols = lines[0].toLowerCase().split(delimiter);
    if (firstCols.some((c) => ['fecha', 'date', 'concepto', 'descripcion', 'description'].includes(c))) {
      startIndex = 1;
    }

    const rows: Array<{
      movementDate: Date;
      description: string;
      amount: number;
      type: 'in' | 'out';
      reference?: string;
    }> = [];

    for (let i = startIndex; i < lines.length; i++) {
      const cols = this.splitCsvLine(lines[i], delimiter);
      if (cols.length < 3) continue;

      const dateRaw = cols[0];
      const description = cols[1]?.replace(/^"|"$/g, '') ?? '';
      const amountRaw = cols[2]?.replace(',', '.').replace(/^"|"$/g, '') ?? '0';
      const typeRaw = cols[3]?.toLowerCase().replace(/^"|"$/g, '');
      const reference = cols[4]?.replace(/^"|"$/g, '') || undefined;

      const parsedDate = new Date(dateRaw);
      if (Number.isNaN(parsedDate.getTime()) || !description) continue;

      let amount = Math.abs(Number(amountRaw));
      if (!Number.isFinite(amount) || amount <= 0) continue;

      let type: 'in' | 'out';
      if (typeRaw === 'in' || typeRaw === 'entrada' || typeRaw === 'credit') {
        type = 'in';
      } else if (typeRaw === 'out' || typeRaw === 'salida' || typeRaw === 'debit') {
        type = 'out';
      } else {
        type = Number(amountRaw) < 0 ? 'out' : 'in';
      }

      rows.push({
        movementDate: parsedDate,
        description,
        amount,
        type,
        reference,
      });
    }

    return rows;
  }

  private splitCsvLine(line: string, delimiter: string) {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    result.push(current.trim());
    return result;
  }

  private mapMovement(m: {
    id: string;
    bankAccountId: string;
    movementDate: Date;
    description: string;
    amount: { toNumber?: () => number } | number | string;
    type: string;
    reference: string | null;
    status: string;
    paymentId: string | null;
    importBatchId: string | null;
    createdAt: Date;
    bankAccount?: { id: string; name: string };
    payment?: {
      id: string;
      amount: { toNumber?: () => number } | number | string;
      invoice: { id: string; number: string };
    } | null;
  }) {
    return {
      id: m.id,
      bankAccountId: m.bankAccountId,
      bankAccount: m.bankAccount,
      movementDate: m.movementDate.toISOString().slice(0, 10),
      description: m.description,
      amount: Number(m.amount),
      type: m.type as 'in' | 'out',
      reference: m.reference,
      status: m.status as 'pending' | 'reconciled',
      paymentId: m.paymentId,
      payment: m.payment
        ? {
            id: m.payment.id,
            amount: Number(m.payment.amount),
            invoice: m.payment.invoice,
          }
        : null,
      importBatchId: m.importBatchId,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
