import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DocumentNumberService } from '../../common/documents/document-number.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { calcLines } from '../../common/utils/document-totals';

const invoiceInclude = {
  client: { select: { id: true, name: true, taxId: true } },
  lines: true,
  payments: { orderBy: { paymentDate: 'desc' as const } },
  originalInvoice: { select: { id: true, number: true, issueDate: true } },
  creditNotes: {
    where: { deletedAt: null },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      issueDate: true,
      creditReason: true,
    },
    orderBy: { issueDate: 'desc' as const },
  },
} as const;

@Injectable()
export class InvoicesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docNumbers: DocumentNumberService,
  ) {}

  findMany(companyId: string, query: QueryInvoicesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const overdue = query.overdue === '1' || query.overdue === 'true';

    const where = {
      companyId,
      deletedAt: null,
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(overdue
        ? {
            status: { in: ['issued', 'partially_paid'] },
            dueDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
          }
        : query.status
          ? { status: query.status }
          : {}),
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
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: invoiceInclude,
      }),
      this.prisma.invoice.count({ where }),
    ]);
  }

  findById(id: string, companyId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: invoiceInclude,
    });
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const taxRate = dto.taxRate ?? 21;
    const totals = calcLines(dto.lines, taxRate);
    const number = dto.number ?? await this.docNumbers.nextNumber(companyId, 'invoice');

    return this.prisma.invoice.create({
      data: {
        companyId,
        number,
        clientId: dto.clientId,
        orderId: dto.orderId,
        status: dto.status ?? 'draft',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
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
      include: invoiceInclude,
    });
  }

  async update(id: string, companyId: string, dto: UpdateInvoiceDto) {
    const existing = await this.findById(id, companyId);
    if (!existing) return null;

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const data: Record<string, unknown> = {
      ...(dto.number !== undefined ? { number: dto.number } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.orderId !== undefined ? { orderId: dto.orderId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.issueDate !== undefined ? { issueDate: new Date(dto.issueDate) } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };

    if (dto.lines) {
      const totals = calcLines(dto.lines, taxRate);
      data.taxRate = totals.taxRate;
      data.subtotal = totals.subtotal;
      data.taxAmount = totals.taxAmount;
      data.total = totals.total;

      return this.prisma.$transaction(async (tx) => {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
        return tx.invoice.update({
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
          include: invoiceInclude,
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

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });
  }

  /**
   * Crea una factura rectificativa con serie propia. Los importes se guardan en positivo
   * y el signo se aplica en la presentación, la contabilidad y los informes.
   */
  async createCreditNote(
    companyId: string,
    original: { id: string; clientId: string; taxRate: number },
    params: {
      reason: string;
      lines: Array<{ productId?: string; description: string; quantity: number; unitPrice: number }>;
      issueDate?: string;
      notes?: string;
    },
  ) {
    const totals = calcLines(params.lines, original.taxRate);
    const issueDate = params.issueDate ? new Date(params.issueDate) : new Date();
    const number = await this.docNumbers.nextNumber(companyId, 'credit_note', issueDate);

    return this.prisma.invoice.create({
      data: {
        companyId,
        number,
        clientId: original.clientId,
        documentType: 'credit_note',
        originalInvoiceId: original.id,
        creditReason: params.reason,
        status: 'issued',
        issueDate,
        notes: params.notes,
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
      include: invoiceInclude,
    });
  }

  softDelete(id: string) {
    return this.prisma.invoice.update({
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
      dueDate: source.dueDate?.toISOString(),
      lines: source.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
  }
}
