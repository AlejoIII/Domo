import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { AccountingChartService } from './accounting-chart.service';
import { ACCOUNT_CODES } from './pgce-defaults';

type InvoiceLike = {
  id: string;
  number: string;
  issueDate: Date;
  subtotal: Prisma.Decimal | number;
  taxAmount: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
};

@Injectable()
export class AccountingPostingService {
  private readonly logger = new Logger(AccountingPostingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chart: AccountingChartService,
  ) {}

  async postInvoiceIssue(companyId: string, invoice: InvoiceLike) {
    const exists = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_issue', referenceId: invoice.id },
    });
    if (exists) return;

    const subtotal = Number(invoice.subtotal);
    const taxAmount = Number(invoice.taxAmount);
    const total = Number(invoice.total);
    if (total <= 0) return;

    const clients = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.clients);
    const sales = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.sales);
    const vat = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.vatOutput);
    if (!clients || !sales || !vat) {
      this.logger.warn(`Chart incompleto para empresa ${companyId}`);
      return;
    }

    const lines: Array<{ accountId: string; debit: number; credit: number }> = [
      { accountId: clients.id, debit: total, credit: 0 },
      { accountId: sales.id, debit: 0, credit: subtotal },
    ];
    if (taxAmount > 0) {
      lines.push({ accountId: vat.id, debit: 0, credit: taxAmount });
    }

    await this.createEntry(companyId, {
      entryDate: invoice.issueDate,
      description: `Emisión factura ${invoice.number}`,
      referenceType: 'invoice_issue',
      referenceId: invoice.id,
      lines,
    });
  }

  /**
   * Asiento de factura rectificativa: inverso al de emisión.
   * Debe 700 (base) + Debe 477 (IVA) | Haber 430 (total).
   */
  async postCreditNoteIssue(
    companyId: string,
    creditNote: InvoiceLike,
    originalNumber: string,
  ) {
    const exists = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'credit_note_issue', referenceId: creditNote.id },
    });
    if (exists) return;

    const subtotal = Number(creditNote.subtotal);
    const taxAmount = Number(creditNote.taxAmount);
    const total = Number(creditNote.total);
    if (total <= 0) return;

    const clients = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.clients);
    const sales = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.sales);
    const vat = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.vatOutput);
    if (!clients || !sales || !vat) {
      this.logger.warn(`Chart incompleto para empresa ${companyId}`);
      return;
    }

    const lines: Array<{ accountId: string; debit: number; credit: number }> = [
      { accountId: sales.id, debit: subtotal, credit: 0 },
    ];
    if (taxAmount > 0) {
      lines.push({ accountId: vat.id, debit: taxAmount, credit: 0 });
    }
    lines.push({ accountId: clients.id, debit: 0, credit: total });

    await this.createEntry(companyId, {
      entryDate: creditNote.issueDate,
      description: `Rectificativa ${creditNote.number} sobre factura ${originalNumber}`,
      referenceType: 'credit_note_issue',
      referenceId: creditNote.id,
      lines,
    });
  }

  async postInvoicePayment(
    companyId: string,
    payment: { id: string; invoiceId: string; amount: Prisma.Decimal | number; paymentDate: Date },
    invoiceNumber: string,
  ) {
    const exists = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_payment', referenceId: payment.id },
    });
    if (exists) return;

    const amount = Number(payment.amount);
    if (amount <= 0) return;

    const bank = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.bank);
    const clients = await this.chart.getAccountByCode(companyId, ACCOUNT_CODES.clients);
    if (!bank || !clients) return;

    await this.createEntry(companyId, {
      entryDate: payment.paymentDate,
      description: `Cobro factura ${invoiceNumber}`,
      referenceType: 'invoice_payment',
      referenceId: payment.id,
      lines: [
        { accountId: bank.id, debit: amount, credit: 0 },
        { accountId: clients.id, debit: 0, credit: amount },
      ],
    });
  }

  async voidInvoiceIssue(companyId: string, invoiceId: string, invoiceNumber: string) {
    const original = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_issue', referenceId: invoiceId },
      include: { lines: true },
    });
    if (!original) return;

    const voidRef = `void_${invoiceId}`;
    const exists = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_issue_void', referenceId: voidRef },
    });
    if (exists) return;

    await this.createEntry(companyId, {
      entryDate: new Date(),
      description: `Anulación emisión factura ${invoiceNumber}`,
      referenceType: 'invoice_issue_void',
      referenceId: voidRef,
      lines: original.lines.map((line) => ({
        accountId: line.accountId,
        debit: Number(line.credit),
        credit: Number(line.debit),
      })),
    });
  }

  async voidInvoicePayment(companyId: string, paymentId: string, invoiceNumber: string) {
    const original = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_payment', referenceId: paymentId },
      include: { lines: true },
    });
    if (!original) return;

    const voidRef = `void_${paymentId}`;
    const exists = await this.prisma.journalEntry.findFirst({
      where: { companyId, referenceType: 'invoice_payment_void', referenceId: voidRef },
    });
    if (exists) return;

    await this.createEntry(companyId, {
      entryDate: new Date(),
      description: `Anulación cobro factura ${invoiceNumber}`,
      referenceType: 'invoice_payment_void',
      referenceId: voidRef,
      lines: original.lines.map((line) => ({
        accountId: line.accountId,
        debit: Number(line.credit),
        credit: Number(line.debit),
      })),
    });
  }

  private async createEntry(
    companyId: string,
    params: {
      entryDate: Date;
      description: string;
      referenceType: string;
      referenceId: string;
      lines: Array<{ accountId: string; debit: number; credit: number }>;
    },
  ) {
    const last = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
    const entryNumber = (last?.entryNumber ?? 0) + 1;

    await this.prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        entryDate: params.entryDate,
        description: params.description,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        lines: {
          create: params.lines.map((line, index) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            lineOrder: index,
          })),
        },
      },
    });
  }
}
