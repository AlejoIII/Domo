import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { formatDocumentNumber } from '../utils/document-totals';

export type DocumentNumberType =
  | 'order'
  | 'invoice'
  | 'credit_note'
  | 'quote'
  | 'purchase_order'
  | 'delivery_note';

const PREFIX_FIELD: Record<
  Exclude<DocumentNumberType, 'delivery_note'>,
  'orderPrefix' | 'invoicePrefix' | 'creditNotePrefix' | 'quotePrefix' | 'poPrefix'
> = {
  order: 'orderPrefix',
  invoice: 'invoicePrefix',
  credit_note: 'creditNotePrefix',
  quote: 'quotePrefix',
  purchase_order: 'poPrefix',
};

@Injectable()
export class DocumentNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(
    companyId: string,
    docType: DocumentNumberType,
    date = new Date(),
  ): Promise<string> {
    const year = date.getFullYear();
    const prefix = await this.resolvePrefix(companyId, docType);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.documentNumberSequence.findUnique({
        where: { companyId_docType_year: { companyId, docType, year } },
      });

      const seq = existing ?? await tx.documentNumberSequence.create({
        data: {
          companyId,
          docType,
          year,
          lastValue: await this.bootstrapLastValue(tx, companyId, docType, prefix, year),
        },
      });

      const updated = await tx.documentNumberSequence.update({
        where: { id: seq.id },
        data: { lastValue: { increment: 1 } },
      });

      return formatDocumentNumber(prefix, updated.lastValue, date);
    });
  }

  private async resolvePrefix(companyId: string, docType: DocumentNumberType): Promise<string> {
    if (docType === 'delivery_note') return 'ALB';

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        orderPrefix: true,
        invoicePrefix: true,
        creditNotePrefix: true,
        quotePrefix: true,
        poPrefix: true,
      },
    });

    const field = PREFIX_FIELD[docType];
    return company[field] ?? this.defaultPrefix(docType);
  }

  private defaultPrefix(docType: Exclude<DocumentNumberType, 'delivery_note'>): string {
    const map = {
      order: 'PED',
      invoice: 'FAC',
      credit_note: 'REC',
      quote: 'PRE',
      purchase_order: 'OC',
    };
    return map[docType];
  }

  private async bootstrapLastValue(
    tx: Prisma.TransactionClient,
    companyId: string,
    docType: DocumentNumberType,
    prefix: string,
    year: number,
  ): Promise<number> {
    const numbers = await this.loadExistingNumbers(tx, companyId, docType);
    const yearPrefix = `${prefix}-${year}`;
    let max = 0;

    for (const number of numbers) {
      if (!number.startsWith(yearPrefix)) continue;
      const seq = this.parseSequence(number);
      if (seq > max) max = seq;
    }

    return max;
  }

  private parseSequence(number: string): number {
    const match = number.match(/-(\d{4})$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private loadExistingNumbers(
    tx: Prisma.TransactionClient,
    companyId: string,
    docType: DocumentNumberType,
  ): Promise<string[]> {
    switch (docType) {
      case 'order':
        return tx.salesOrder.findMany({ where: { companyId }, select: { number: true } })
          .then((rows) => rows.map((r) => r.number));
      case 'invoice':
        return tx.invoice.findMany({
          where: { companyId, documentType: 'invoice' },
          select: { number: true },
        }).then((rows) => rows.map((r) => r.number));
      case 'credit_note':
        return tx.invoice.findMany({
          where: { companyId, documentType: 'credit_note' },
          select: { number: true },
        }).then((rows) => rows.map((r) => r.number));
      case 'quote':
        return tx.quote.findMany({ where: { companyId }, select: { number: true } })
          .then((rows) => rows.map((r) => r.number));
      case 'purchase_order':
        return tx.purchaseOrder.findMany({ where: { companyId }, select: { number: true } })
          .then((rows) => rows.map((r) => r.number));
      case 'delivery_note':
        return tx.salesOrder.findMany({
          where: { companyId, deliveryNoteNumber: { not: null } },
          select: { deliveryNoteNumber: true },
        }).then((rows) => rows.map((r) => r.deliveryNoteNumber!));
      default:
        return Promise.resolve([]);
    }
  }
}
