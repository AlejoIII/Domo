import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DocumentNumberService } from '../../common/documents/document-number.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { calcLines } from '../../common/utils/document-totals';

const quoteInclude = {
  client: { select: { id: true, name: true } },
  lines: true,
} as const;

@Injectable()
export class QuotesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docNumbers: DocumentNumberService,
  ) {}

  findMany(companyId: string, query: QueryQuotesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: 'insensitive' as const } },
              { notes: { contains: query.search, mode: 'insensitive' as const } },
              { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: quoteInclude,
      }),
      this.prisma.quote.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.quote.findFirst({
      where: { id, companyId, deletedAt: null },
      include: quoteInclude,
    });
  }

  async create(companyId: string, dto: CreateQuoteDto) {
    const taxRate = dto.taxRate ?? 21;
    const totals = calcLines(dto.lines, taxRate);
    const number = dto.number ?? await this.docNumbers.nextNumber(companyId, 'quote');

    return this.prisma.quote.create({
      data: {
        companyId,
        number,
        clientId: dto.clientId,
        status: dto.status ?? 'draft',
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        taxRate: totals.taxRate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        lines: {
          create: totals.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
      },
      include: quoteInclude,
    });
  }

  async update(id: string, companyId: string, dto: UpdateQuoteDto) {
    const existing = await this.findById(id, companyId);
    if (!existing) return null;

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const data: Record<string, unknown> = {
      ...(dto.number !== undefined ? { number: dto.number } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.quoteDate !== undefined ? { quoteDate: new Date(dto.quoteDate) } : {}),
      ...(dto.validUntil !== undefined ? { validUntil: new Date(dto.validUntil) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };

    if (dto.lines) {
      const totals = calcLines(dto.lines, taxRate);
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;

      return this.prisma.$transaction(async (tx) => {
        await tx.quoteLine.deleteMany({ where: { quoteId: id } });
        return tx.quote.update({
          where: { id },
          data: {
            ...data,
            lines: {
              create: totals.lines.map((line) => ({
                productId: line.productId,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineTotal: line.lineTotal,
              })),
            },
          },
          include: quoteInclude,
        });
      });
    }

    if (dto.taxRate !== undefined && !dto.lines) {
      const totals = calcLines(
        existing.lines.map((l) => ({
          productId: l.productId ?? undefined,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        taxRate,
      );
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;
    }

    return this.prisma.quote.update({
      where: { id },
      data,
      include: quoteInclude,
    });
  }

  softDelete(id: string) {
    return this.prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, companyId: string) {
    const source = await this.findById(id, companyId);
    if (!source) return null;

    const noteSuffix = `(Copia de ${source.number})`;
    const notes = source.notes ? `${source.notes}\n${noteSuffix}` : noteSuffix;

    return this.create(companyId, {
      clientId: source.clientId,
      status: 'draft',
      taxRate: Number(source.taxRate),
      notes,
      validUntil: source.validUntil?.toISOString(),
      lines: source.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
  }
}
