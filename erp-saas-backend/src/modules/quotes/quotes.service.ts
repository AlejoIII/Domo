import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuotesRepository } from './quotes.repository';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { SendDocumentEmailDto } from '../documents/dto/send-document-email.dto';
import { OrdersService } from '../orders/orders.service';
import { QueueService } from '../../common/queue/queue.service';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { DocumentPdfService } from '../../common/pdf/document-pdf.service';
import { PdfDocumentData } from '../../common/pdf/document-pdf.types';
import {
  PLAN_FEATURE_KEYS,
  PRINT_WATERMARK_TEXT,
} from '../billing/plan-features.constants';

@Injectable()
export class QuotesService {
  constructor(
    private readonly repo: QuotesRepository,
    private readonly ordersService: OrdersService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly documentPdf: DocumentPdfService,
  ) {}

  async findAll(companyId: string, query: QueryQuotesDto) {
    const [items, total] = await this.repo.findMany(companyId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const quote = await this.repo.findById(id, companyId);
    if (!quote) throw new NotFoundException('Presupuesto no encontrado');
    return quote;
  }

  async create(companyId: string, dto: CreateQuoteDto) {
    await this.planLimits.assertCanCreateDocument(companyId);
    const quote = await this.repo.create(companyId, dto);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return quote;
  }

  async update(id: string, companyId: string, dto: UpdateQuoteDto) {
    await this.findOne(id, companyId);
    const quote = await this.repo.update(id, companyId, dto);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return quote;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.repo.softDelete(id);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return { message: 'Presupuesto eliminado' };
  }

  async convertToOrder(id: string, companyId: string) {
    const quote = await this.findOne(id, companyId);
    if (quote.status === 'rejected' || quote.status === 'expired') {
      throw new BadRequestException('No se puede convertir este presupuesto');
    }
    if (quote.status === 'accepted') {
      throw new BadRequestException('Este presupuesto ya fue convertido');
    }

    const order = await this.ordersService.create(companyId, {
      clientId: quote.clientId,
      status: 'confirmed',
      taxRate: Number(quote.taxRate),
      notes: quote.notes
        ? `${quote.notes}\n(Desde presupuesto ${quote.number})`
        : `Desde presupuesto ${quote.number}`,
      lines: quote.lines.map((l) => ({
        productId: l.productId ?? undefined,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });

    await this.repo.update(id, companyId, { status: 'accepted' });
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return order;
  }

  async duplicate(id: string, companyId: string) {
    const copy = await this.repo.duplicate(id, companyId);
    if (!copy) throw new NotFoundException('Presupuesto no encontrado');
    return copy;
  }

  async getPdf(id: string, companyId: string) {
    const quote = await this.repo.findById(id, companyId);
    if (!quote) throw new NotFoundException('Presupuesto no encontrado');

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
        where: { id: quote.clientId, companyId },
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

    const data: PdfDocumentData = {
      kind: 'quote',
      number: quote.number,
      issueDate: quote.quoteDate,
      dueDate: quote.validUntil,
      status: quote.status,
      notes: quote.notes,
      currency: company.currency ?? 'EUR',
      subtotal: Number(quote.subtotal),
      taxRate: Number(quote.taxRate),
      taxAmount: Number(quote.taxAmount),
      total: Number(quote.total),
      lines: quote.lines.map((line) => ({
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),
      issuer: company,
      recipient: client ?? { name: quote.client?.name ?? 'Cliente' },
      watermark: showWatermark ? PRINT_WATERMARK_TEXT : null,
    };

    return {
      buffer: await this.documentPdf.render(data),
      fileName: this.documentPdf.buildFileName(data),
    };
  }

  async sendEmail(id: string, companyId: string, dto: SendDocumentEmailDto) {
    const quote = await this.repo.findById(id, companyId);
    if (!quote) throw new NotFoundException('Presupuesto no encontrado');

    const client = await this.prisma.client.findFirst({
      where: { id: quote.clientId, companyId },
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
    const printUrl = `${frontendUrl.replace(/\/$/, '')}/quotes/${id}/print`;

    this.queue.enqueueDocumentEmail({
      to,
      documentType: 'quote',
      documentNumber: quote.number,
      companyName: company.name,
      printUrl,
    });

    return { message: 'Presupuesto encolado para envío por email', to, queued: true };
  }
}
