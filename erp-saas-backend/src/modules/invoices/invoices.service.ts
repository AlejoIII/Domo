import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoicesRepository } from './invoices.repository';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { CreateCreditNoteDto } from './dto/credit-note.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { SendDocumentEmailDto } from '../documents/dto/send-document-email.dto';
import { PrismaService } from '../../common/database/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import {
  computeInvoiceBalances,
  mapInvoice,
  resolveStatusAfterPayment,
  sumCreditNotes,
  sumPayments,
} from './invoice.mapper';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { AccountingPostingService } from '../accounting/accounting-posting.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { round2 } from '../../common/utils/document-totals';
import { DocumentPdfService } from '../../common/pdf/document-pdf.service';
import { PdfDocumentData } from '../../common/pdf/document-pdf.types';
import {
  PLAN_FEATURE_KEYS,
  PRINT_WATERMARK_TEXT,
} from '../billing/plan-features.constants';
import { VerifactuRecordService } from '../verifactu/verifactu-record.service';
import { calcLines } from '../../common/utils/document-totals';
import { VERIFACTU_RECORD_TYPE } from '../verifactu/verifactu.constants';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly repo: InvoicesRepository,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
    private readonly planLimits: PlanLimitsService,
    private readonly webhooks: WebhookDispatcherService,
    private readonly accountingPosting: AccountingPostingService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly documentPdf: DocumentPdfService,
    private readonly verifactu: VerifactuRecordService,
  ) {}

  async findAll(companyId: string, query: QueryInvoicesDto) {
    const [items, total] = await this.repo.findMany(companyId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items: items.map(mapInvoice),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.repo.findById(id, companyId);
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return mapInvoice(invoice);
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    await this.planLimits.assertCanCreateDocument(companyId);
    const invoice = await this.repo.create(companyId, dto);
    if (invoice.status === 'issued') {
      await this.accountingPosting.postInvoiceIssue(companyId, invoice);
      try {
        await this.verifactu.recordAltaOnIssue(invoice);
      } catch (err) {
        // La factura ya está emitida; no revertir por fallo de remisión/cadena
        console.error('Verifactu alta failed after invoice issue', err);
      }
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return mapInvoice(await this.repo.findById(invoice.id, companyId) ?? invoice);
  }

  async update(id: string, companyId: string, dto: UpdateInvoiceDto) {
    const before = await this.repo.findById(id, companyId);
    await this.findOne(id, companyId);
    if (before?.documentType === 'credit_note') {
      throw new BadRequestException('Una factura rectificativa emitida no se puede modificar');
    }
    const updated = await this.repo.update(id, companyId, dto);
    if (!updated) throw new NotFoundException('Factura no encontrada');
    if (before && before.status !== 'issued' && updated.status === 'issued') {
      await this.accountingPosting.postInvoiceIssue(companyId, updated);
      try {
        await this.verifactu.recordAltaOnIssue(updated);
      } catch (err) {
        console.error('Verifactu alta failed after invoice issue', err);
      }
    }
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return mapInvoice(await this.repo.findById(updated.id, companyId) ?? updated);
  }

  async remove(id: string, companyId: string) {
    const invoice = await this.repo.findById(id, companyId);
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.documentType === 'credit_note') {
      throw new BadRequestException('Una factura rectificativa emitida no se puede eliminar');
    }
    if (invoice.creditNotes.length > 0) {
      throw new BadRequestException(
        'La factura tiene rectificativas asociadas y no se puede eliminar',
      );
    }
    await this.repo.softDelete(id);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return { message: 'Factura eliminada' };
  }

  async duplicate(id: string, companyId: string) {
    const source = await this.repo.findById(id, companyId);
    if (!source) throw new NotFoundException('Factura no encontrada');
    if (source.documentType === 'credit_note') {
      throw new BadRequestException('Las facturas rectificativas no se pueden duplicar');
    }
    const copy = await this.repo.duplicate(id, companyId);
    if (!copy) throw new NotFoundException('Factura no encontrada');
    return mapInvoice(copy);
  }

  /**
   * Emite una factura rectificativa (nota de crédito) sobre una factura existente.
   * Sin líneas rectifica el importe completo; con líneas permite rectificación parcial.
   */
  async createCreditNote(
    invoiceId: string,
    companyId: string,
    dto: CreateCreditNoteDto,
  ) {
    const original = await this.repo.findById(invoiceId, companyId);
    if (!original) throw new NotFoundException('Factura no encontrada');

    if (original.documentType === 'credit_note') {
      throw new BadRequestException('No se puede rectificar una factura rectificativa');
    }
    if (original.status === 'draft') {
      throw new BadRequestException('Emite la factura antes de rectificarla');
    }
    if (original.status === 'cancelled') {
      throw new BadRequestException('No se puede rectificar una factura anulada');
    }

    const total = Number(original.total);
    const alreadyCredited = sumCreditNotes(original.creditNotes);
    const creditableAmount = round2(total - alreadyCredited);
    if (creditableAmount <= 0) {
      throw new BadRequestException('La factura ya está rectificada por su importe total');
    }

    const lines = dto.lines?.length
      ? dto.lines
      : original.lines.map((line) => ({
          productId: line.productId ?? undefined,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          taxRate: line.taxRate != null ? Number(line.taxRate) : undefined,
        }));

    const taxRate = Number(original.taxRate);
    const requested = calcLines(
      lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: 'taxRate' in line ? line.taxRate : undefined,
      })),
      taxRate,
    ).total;
    if (requested > creditableAmount + 0.01) {
      throw new BadRequestException(
        `El importe a rectificar (${requested}) supera el pendiente de rectificar (${creditableAmount})`,
      );
    }

    await this.planLimits.assertCanCreateDocument(companyId);

    const creditNote = await this.repo.createCreditNote(
      companyId,
      { id: original.id, clientId: original.clientId, taxRate },
      {
        reason: dto.reason,
        lines,
        issueDate: dto.issueDate,
        notes: dto.notes,
      },
    );

    await this.accountingPosting.postCreditNoteIssue(companyId, creditNote, original.number);
    try {
      await this.verifactu.recordAltaOnIssue({
        ...creditNote,
        originalInvoice: {
          number: original.number,
          issueDate: original.issueDate,
        },
      });
    } catch (err) {
      console.error('Verifactu alta failed after credit note', err);
    }
    await this.syncInvoiceStatus(original.id);
    this.cacheInvalidation.onBusinessDataChanged(companyId);

    return mapInvoice(await this.repo.findById(creditNote.id, companyId) ?? creditNote);
  }

  /** PDF generado en servidor: no depende del navegador ni de la vista de impresión. */
  async getPdf(id: string, companyId: string) {
    const invoice = await this.repo.findById(id, companyId);
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const [company, client, companyWithPlan] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: companyId },
        select: {
          name: true,
          taxId: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          email: true,
          phone: true,
          currency: true,
        },
      }),
      this.prisma.client.findFirst({
        where: { id: invoice.clientId, companyId },
        select: {
          name: true,
          taxId: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          email: true,
          phone: true,
        },
      }),
      this.planLimits.getCompanyWithPlan(companyId),
    ]);

    const plan = this.planLimits.resolvePlan(companyWithPlan);
    const showWatermark = this.planLimits.hasFeature(
      plan.features,
      PLAN_FEATURE_KEYS.pdfWatermark,
    );

    const { paidAmount, balanceDue } = computeInvoiceBalances(
      invoice,
      invoice.payments,
      invoice.creditNotes,
    );
    const isCreditNote = invoice.documentType === 'credit_note';
    const lineInputs = invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      taxRate: line.taxRate != null ? Number(line.taxRate) : null,
    }));
    const totals = calcLines(lineInputs, Number(invoice.taxRate));

    const verifactuAlta = await this.prisma.verifactuRecord.findFirst({
      where: {
        companyId,
        invoiceId: invoice.id,
        recordType: VERIFACTU_RECORD_TYPE.ALTA,
      },
      orderBy: { sequenceNo: 'desc' },
      select: { qrPayload: true, huella: true },
    });

    const data: PdfDocumentData = {
      kind: isCreditNote ? 'credit_note' : 'invoice',
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      creditReason: invoice.creditReason,
      originalNumber: invoice.originalInvoice?.number ?? null,
      currency: company.currency ?? 'EUR',
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      taxBreakdown: totals.taxBreakdown,
      paidAmount: isCreditNote ? undefined : paidAmount,
      balanceDue: isCreditNote ? undefined : balanceDue,
      lines: invoice.lines.map((line) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
        taxRate: line.taxRate != null ? Number(line.taxRate) : Number(invoice.taxRate),
      })),
      issuer: company,
      recipient: client ?? { name: invoice.client?.name ?? 'Cliente' },
      watermark: showWatermark ? PRINT_WATERMARK_TEXT : null,
      verifactuQrUrl: verifactuAlta?.qrPayload ?? null,
      verifactuHuella: verifactuAlta?.huella ?? null,
    };

    return {
      buffer: await this.documentPdf.render(data),
      fileName: this.documentPdf.buildFileName(data),
    };
  }

  async sendEmail(id: string, companyId: string, dto: SendDocumentEmailDto) {
    const invoice = await this.repo.findById(id, companyId);
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const client = await this.prisma.client.findFirst({
      where: { id: invoice.clientId, companyId },
      select: { email: true, name: true },
    });
    const to = dto.to ?? client?.email;
    if (!to) {
      throw new BadRequestException('Indica un email de destino o configura el email del cliente');
    }

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { name: true },
    });
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const printUrl = `${frontendUrl.replace(/\/$/, '')}/invoices/${id}/print`;

    this.queue.enqueueDocumentEmail({
      to,
      documentType: 'invoice',
      documentNumber: invoice.number,
      companyName: company.name,
      printUrl,
    });

    return { message: 'Factura encolada para envío por email', to, queued: true };
  }

  async listPayments(invoiceId: string, companyId: string) {
    const invoice = await this.findOne(invoiceId, companyId);
    return invoice.payments;
  }

  async createPayment(
    invoiceId: string,
    companyId: string,
    dto: CreatePaymentDto,
    userId?: string,
  ) {
    const raw = await this.repo.findById(invoiceId, companyId);
    if (!raw) throw new NotFoundException('Factura no encontrada');

    if (raw.documentType === 'credit_note') {
      throw new BadRequestException(
        'Las rectificativas no admiten cobros; registra la devolución en tesorería',
      );
    }
    if (raw.status === 'draft') {
      throw new BadRequestException('Emite la factura antes de registrar pagos');
    }
    if (raw.status === 'cancelled') {
      throw new BadRequestException('No se pueden registrar pagos en facturas canceladas');
    }

    const { balanceDue } = computeInvoiceBalances(raw, raw.payments, raw.creditNotes);
    if (dto.amount > balanceDue + 0.001) {
      throw new BadRequestException(`El pago supera el saldo pendiente (${balanceDue})`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        invoiceId,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        method: dto.method ?? 'transfer',
        reference: dto.reference,
        notes: dto.notes,
        createdBy: userId,
      },
    });

    await this.accountingPosting.postInvoicePayment(companyId, payment, raw.number);

    await this.syncInvoiceStatus(invoiceId);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return this.findOne(invoiceId, companyId);
  }

  async cancel(id: string, companyId: string) {
    const invoice = await this.repo.findById(id, companyId);
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    if (invoice.documentType === 'credit_note') {
      throw new BadRequestException('Una factura rectificativa emitida no se puede anular');
    }
    if (invoice.status === 'cancelled') {
      return mapInvoice(invoice);
    }
    if (invoice.status === 'draft') {
      throw new BadRequestException('Las facturas en borrador se eliminan, no se anulan');
    }
    if (invoice.creditNotes.length > 0) {
      throw new BadRequestException(
        'La factura tiene rectificativas emitidas; no se puede anular',
      );
    }
    if (['partially_paid', 'paid'].includes(invoice.status)) {
      throw new BadRequestException('No se puede anular una factura con cobros registrados');
    }
    if (invoice.status !== 'issued') {
      throw new BadRequestException('Solo se pueden anular facturas emitidas sin cobros');
    }
    if (invoice.payments.length > 0) {
      throw new BadRequestException('Anula los cobros antes de anular la factura');
    }

    await this.accountingPosting.voidInvoiceIssue(companyId, invoice.id, invoice.number);

    const updated = await this.repo.update(id, companyId, { status: 'cancelled' });
    if (!updated) throw new NotFoundException('Factura no encontrada');

    try {
      await this.verifactu.recordAnulacionOnCancel(invoice);
    } catch (err) {
      console.error('Verifactu anulacion failed after invoice cancel', err);
    }

    if (invoice.orderId) {
      await this.prisma.salesOrder.updateMany({
        where: { id: invoice.orderId, companyId, status: 'invoiced' },
        data: { status: 'confirmed' },
      });
    }

    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return mapInvoice(updated);
  }

  async removePayment(paymentId: string, companyId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: { invoice: { select: { number: true } } },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    await this.accountingPosting.voidInvoicePayment(
      companyId,
      paymentId,
      payment.invoice.number,
    );

    await this.prisma.payment.delete({ where: { id: paymentId } });
    await this.syncInvoiceStatus(payment.invoiceId);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return { message: 'Pago anulado' };
  }

  private async syncInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        creditNotes: {
          where: { deletedAt: null },
          select: { total: true, status: true },
        },
      },
    });
    if (!invoice || invoice.documentType === 'credit_note') return;

    const paidAmount = sumPayments(invoice.payments);
    const creditedAmount = sumCreditNotes(invoice.creditNotes);
    const nextStatus = resolveStatusAfterPayment(
      invoice.status,
      Number(invoice.total),
      paidAmount,
      creditedAmount,
    );

    if (nextStatus !== invoice.status) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: nextStatus },
      });

      if (nextStatus === 'paid') {
        this.webhooks.emit(invoice.companyId, 'invoice.paid', {
          invoiceId: invoice.id,
          number: invoice.number,
          total: Number(invoice.total),
          clientId: invoice.clientId,
          paidAt: new Date().toISOString(),
        });
      }
    }
  }
}
