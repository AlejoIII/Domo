import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import { VerifactuAeatClient } from './verifactu-aeat.client';
import { VerifactuHashService } from './verifactu-hash.service';
import { VerifactuXmlBuilder } from './verifactu-xml.builder';
import {
  VERIFACTU_AEAT_STATUS,
  VERIFACTU_RECORD_TYPE,
} from './verifactu.constants';
import { calcLines } from '../../common/utils/document-totals';
import type { VerifactuDesgloseIva } from './verifactu-xml.builder';

export interface IssueInvoiceForVerifactu {
  id: string;
  companyId: string;
  number: string;
  documentType: string;
  status: string;
  issueDate: Date;
  subtotal: Prisma.Decimal | number | string;
  taxAmount: Prisma.Decimal | number | string;
  taxRate: Prisma.Decimal | number | string;
  total: Prisma.Decimal | number | string;
  notes?: string | null;
  lines?: Array<{
    lineTotal: Prisma.Decimal | number | string;
    taxRate?: Prisma.Decimal | number | string | null;
  }>;
  originalInvoice?: {
    number: string;
    issueDate: Date;
  } | null;
  client?: {
    name: string;
    taxId?: string | null;
  } | null;
}

@Injectable()
export class VerifactuRecordService {
  private readonly logger = new Logger(VerifactuRecordService.name);
  private readonly xml = new VerifactuXmlBuilder();

  constructor(
    private readonly prisma: PrismaService,
    private readonly hash: VerifactuHashService,
    private readonly aeat: VerifactuAeatClient,
    private readonly queue: QueueService,
  ) {}

  async isEnabledForCompany(companyId: string): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { verifactuEnabled: true },
    });
    return !!company?.verifactuEnabled;
  }

  /**
   * Genera RegistroAlta encadenado al emitir factura / rectificativa.
   * Idempotente: si ya existe un alta para la factura, la reutiliza.
   */
  async recordAltaOnIssue(invoice: IssueInvoiceForVerifactu): Promise<void> {
    if (!(await this.isEnabledForCompany(invoice.companyId))) return;
    if (invoice.status === 'draft') return;

    const existing = await this.prisma.verifactuRecord.findFirst({
      where: {
        companyId: invoice.companyId,
        invoiceId: invoice.id,
        recordType: VERIFACTU_RECORD_TYPE.ALTA,
      },
    });
    if (existing) {
      this.logger.debug(`Verifactu alta already exists for invoice ${invoice.id}`);
      return;
    }

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: invoice.companyId },
      select: {
        name: true,
        taxId: true,
        verifactuNif: true,
        verifactuMode: true,
      },
    });

    const nif = (company.verifactuNif || company.taxId || '').replace(/[\s-]/g, '').toUpperCase();
    if (!nif) {
      throw new BadRequestException(
        'Verifactu activo: configura NIF emisor (taxId o verifactuNif) antes de emitir',
      );
    }

    const genAt = new Date();
    const fechaHora = this.hash.formatFechaHoraHuso(genAt);
    const fechaExp = this.hash.formatFechaExpedicion(invoice.issueDate);
    const cuota = this.hash.formatMoney(Number(invoice.taxAmount));
    const importe = this.hash.formatMoney(Number(invoice.total));
    const tipoFactura = this.mapTipoFactura(invoice);
    const desglose = this.buildDesglose(invoice);

    const record = await this.prisma.$transaction(async (tx) => {
      const chain = await tx.verifactuChainHead.upsert({
        where: { companyId: invoice.companyId },
        create: { companyId: invoice.companyId, recordCount: 0 },
        update: {},
      });

      // Bloqueo pesimista vía update de updatedAt + lectura fresca
      const locked = await tx.verifactuChainHead.update({
        where: { id: chain.id },
        data: { updatedAt: new Date() },
      });

      const sequenceNo = locked.recordCount + 1;
      const huellaAnterior = locked.lastHuella ?? '';
      const huella = this.hash.computeAlta({
        idEmisorFactura: nif,
        numSerieFactura: invoice.number,
        fechaExpedicionFactura: fechaExp,
        tipoFactura,
        cuotaTotal: cuota,
        importeTotal: importe,
        huellaAnterior,
        fechaHoraHusoGenRegistro: fechaHora,
      });

      const xmlPayload = this.xml.buildRegistroAlta({
        idEmisorFactura: nif,
        numSerieFactura: invoice.number,
        fechaExpedicionFactura: fechaExp,
        tipoFactura,
        descripcionOperacion: invoice.notes?.slice(0, 500) || 'Facturación Domo',
        cuotaTotal: cuota,
        importeTotal: importe,
        huella,
        huellaAnterior: locked.lastHuella,
        fechaHoraHusoGenRegistro: fechaHora,
        nombreRazonEmisor: company.name,
        desglose,
        destinatario: invoice.client
          ? {
              nif: invoice.client.taxId ?? undefined,
              nombreRazon: invoice.client.name,
            }
          : undefined,
        facturasRectificadas:
          invoice.documentType === 'credit_note' && invoice.originalInvoice
            ? [
                {
                  idEmisorFactura: nif,
                  numSerieFactura: invoice.originalInvoice.number,
                  fechaExpedicionFactura: this.hash.formatFechaExpedicion(
                    invoice.originalInvoice.issueDate,
                  ),
                },
              ]
            : undefined,
      });

      const qrPayload = this.aeat.buildQrUrl({
        nif,
        numSerie: invoice.number,
        fecha: fechaExp,
        importe,
      });

      const created = await tx.verifactuRecord.create({
        data: {
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          recordType: VERIFACTU_RECORD_TYPE.ALTA,
          invoiceType: tipoFactura,
          idEmisorFactura: nif,
          numSerieFactura: invoice.number,
          fechaExpedicion: fechaExp,
          cuotaTotal: cuota,
          importeTotal: importe,
          huella,
          huellaAnterior: locked.lastHuella,
          fechaHoraHusoGen: genAt,
          sequenceNo,
          xmlPayload,
          qrPayload,
          aeatStatus:
            company.verifactuMode === 'verifactu'
              ? VERIFACTU_AEAT_STATUS.PENDING
              : VERIFACTU_AEAT_STATUS.SKIPPED,
        },
      });

      await tx.verifactuChainHead.update({
        where: { id: locked.id },
        data: {
          lastHuella: huella,
          lastRecordId: created.id,
          lastGeneratedAt: genAt,
          recordCount: sequenceNo,
        },
      });

      return created;
    });

    if (record.aeatStatus === VERIFACTU_AEAT_STATUS.PENDING) {
      this.queue.enqueueVerifactu({
        companyId: invoice.companyId,
        recordId: record.id,
      });
      await this.prisma.verifactuRecord.update({
        where: { id: record.id },
        data: { aeatStatus: VERIFACTU_AEAT_STATUS.QUEUED },
      });
    }
  }

  async recordAnulacionOnCancel(invoice: IssueInvoiceForVerifactu): Promise<void> {
    if (!(await this.isEnabledForCompany(invoice.companyId))) return;

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: invoice.companyId },
      select: { taxId: true, verifactuNif: true, verifactuMode: true },
    });
    const nif = (company.verifactuNif || company.taxId || '').replace(/[\s-]/g, '').toUpperCase();
    if (!nif) {
      throw new BadRequestException('Verifactu activo: falta NIF emisor para anulación');
    }

    const genAt = new Date();
    const fechaHora = this.hash.formatFechaHoraHuso(genAt);
    const fechaExp = this.hash.formatFechaExpedicion(invoice.issueDate);

    const record = await this.prisma.$transaction(async (tx) => {
      const chain = await tx.verifactuChainHead.upsert({
        where: { companyId: invoice.companyId },
        create: { companyId: invoice.companyId, recordCount: 0 },
        update: {},
      });
      const locked = await tx.verifactuChainHead.update({
        where: { id: chain.id },
        data: { updatedAt: new Date() },
      });

      const sequenceNo = locked.recordCount + 1;
      const huellaAnterior = locked.lastHuella ?? '';
      const huella = this.hash.computeAnulacion({
        idEmisorFactura: nif,
        numSerieFactura: invoice.number,
        fechaExpedicionFactura: fechaExp,
        huellaAnterior,
        fechaHoraHusoGenRegistro: fechaHora,
      });

      const xmlPayload = this.xml.buildRegistroAnulacion({
        idEmisorFactura: nif,
        numSerieFactura: invoice.number,
        fechaExpedicionFactura: fechaExp,
        huella,
        huellaAnterior: locked.lastHuella,
        fechaHoraHusoGenRegistro: fechaHora,
      });

      const created = await tx.verifactuRecord.create({
        data: {
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          recordType: VERIFACTU_RECORD_TYPE.ANULACION,
          idEmisorFactura: nif,
          numSerieFactura: invoice.number,
          fechaExpedicion: fechaExp,
          cuotaTotal: 0,
          importeTotal: 0,
          huella,
          huellaAnterior: locked.lastHuella,
          fechaHoraHusoGen: genAt,
          sequenceNo,
          xmlPayload,
          aeatStatus:
            company.verifactuMode === 'verifactu'
              ? VERIFACTU_AEAT_STATUS.PENDING
              : VERIFACTU_AEAT_STATUS.SKIPPED,
        },
      });

      await tx.verifactuChainHead.update({
        where: { id: locked.id },
        data: {
          lastHuella: huella,
          lastRecordId: created.id,
          lastGeneratedAt: genAt,
          recordCount: sequenceNo,
        },
      });

      return created;
    });

    if (record.aeatStatus === VERIFACTU_AEAT_STATUS.PENDING) {
      this.queue.enqueueVerifactu({
        companyId: invoice.companyId,
        recordId: record.id,
      });
      await this.prisma.verifactuRecord.update({
        where: { id: record.id },
        data: { aeatStatus: VERIFACTU_AEAT_STATUS.QUEUED },
      });
    }
  }

  async listRecords(companyId: string, take = 50) {
    return this.prisma.verifactuRecord.findMany({
      where: { companyId },
      orderBy: { sequenceNo: 'desc' },
      take: Math.min(take, 200),
      select: {
        id: true,
        invoiceId: true,
        recordType: true,
        invoiceType: true,
        numSerieFactura: true,
        fechaExpedicion: true,
        importeTotal: true,
        huella: true,
        sequenceNo: true,
        aeatStatus: true,
        aeatCsv: true,
        aeatSentAt: true,
        aeatError: true,
        qrPayload: true,
        createdAt: true,
      },
    });
  }

  async getRecord(companyId: string, recordId: string) {
    const record = await this.prisma.verifactuRecord.findFirst({
      where: { id: recordId, companyId },
    });
    if (!record) throw new NotFoundException('Registro Verifactu no encontrado');
    return record;
  }

  async getChainStatus(companyId: string) {
    const chain = await this.prisma.verifactuChainHead.findUnique({
      where: { companyId },
    });
    const pending = await this.prisma.verifactuRecord.count({
      where: {
        companyId,
        aeatStatus: {
          in: [VERIFACTU_AEAT_STATUS.PENDING, VERIFACTU_AEAT_STATUS.QUEUED, VERIFACTU_AEAT_STATUS.SENT],
        },
      },
    });
    return {
      recordCount: chain?.recordCount ?? 0,
      lastHuella: chain?.lastHuella ?? null,
      lastGeneratedAt: chain?.lastGeneratedAt?.toISOString() ?? null,
      pendingRemits: pending,
    };
  }

  async retryRemit(companyId: string, recordId: string) {
    const record = await this.getRecord(companyId, recordId);
    if (
      ![
        VERIFACTU_AEAT_STATUS.PENDING,
        VERIFACTU_AEAT_STATUS.REJECTED,
        VERIFACTU_AEAT_STATUS.QUEUED,
      ].includes(record.aeatStatus as never)
    ) {
      throw new BadRequestException(`No se puede reenviar en estado ${record.aeatStatus}`);
    }
    this.queue.enqueueVerifactu({ companyId, recordId });
    await this.prisma.verifactuRecord.update({
      where: { id: recordId },
      data: { aeatStatus: VERIFACTU_AEAT_STATUS.QUEUED, aeatError: null },
    });
    return { queued: true };
  }

  private mapTipoFactura(invoice: IssueInvoiceForVerifactu): string {
    if (invoice.documentType === 'credit_note') return 'R1';
    return 'F1';
  }

  private buildDesglose(invoice: IssueInvoiceForVerifactu): VerifactuDesgloseIva[] {
    const defaultRate = Number(invoice.taxRate);
    const lineInputs = (invoice.lines ?? []).map((line) => ({
      description: 'line',
      quantity: 1,
      unitPrice: Number(line.lineTotal),
      taxRate: line.taxRate != null ? Number(line.taxRate) : null,
    }));

    const breakdown =
      lineInputs.length > 0
        ? calcLines(lineInputs, defaultRate).taxBreakdown
        : [
            {
              taxRate: defaultRate,
              base: Number(invoice.subtotal),
              taxAmount: Number(invoice.taxAmount),
            },
          ];

    return breakdown.map((row) => ({
      impuesto: '01',
      claveRegimen: '01',
      calificacionOperacion: 'S1',
      tipoImpositivo: this.hash.formatMoney(row.taxRate),
      baseImponibleOimporteNoSujeto: this.hash.formatMoney(row.base),
      cuotaRepercutida: this.hash.formatMoney(row.taxAmount),
    }));
  }
}
