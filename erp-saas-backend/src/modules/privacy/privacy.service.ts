import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AnonymizeClientDto, DeleteCompanyDataDto } from './dto/privacy.dto';

/** Años de conservación obligatoria de documentación fiscal y contable en España. */
const FISCAL_RETENTION_YEARS = 6;

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Política de retención publicada en la app (RGPD art. 13.2.a). */
  retentionPolicy() {
    return {
      fiscalRetentionYears: FISCAL_RETENTION_YEARS,
      categories: [
        {
          category: 'Datos de facturación y contabilidad',
          retention: `${FISCAL_RETENTION_YEARS} años`,
          basis: 'Obligación legal (Código de Comercio art. 30, LGT art. 66)',
          erasable: false,
        },
        {
          category: 'Datos de contacto de clientes y proveedores',
          retention: 'Mientras exista relación comercial',
          basis: 'Ejecución de contrato / interés legítimo',
          erasable: true,
        },
        {
          category: 'Cuentas de usuario y credenciales',
          retention: 'Hasta la baja de la cuenta',
          basis: 'Ejecución de contrato',
          erasable: true,
        },
        {
          category: 'Registro de auditoría y accesos',
          retention: '12 meses',
          basis: 'Interés legítimo (seguridad)',
          erasable: false,
        },
        {
          category: 'Datos analíticos y de errores',
          retention: '90 días',
          basis: 'Consentimiento (cookies analíticas)',
          erasable: true,
        },
      ],
    };
  }

  /** Export completo de los datos de la empresa (RGPD art. 20, portabilidad). */
  async exportCompanyData(companyId: string, userId?: string) {
    // Selección explícita: el export no debe incluir identificadores de Stripe
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        currency: true,
        defaultTaxRate: true,
        createdAt: true,
        plan: { select: { code: true, name: true } },
      },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const scope = { companyId, deletedAt: null };

    const [
      users,
      clients,
      suppliers,
      products,
      employees,
      invoices,
      quotes,
      orders,
      purchaseOrders,
      payments,
      stockMovements,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: scope,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          role: { select: { name: true } },
        },
      }),
      this.prisma.client.findMany({ where: scope }),
      this.prisma.supplier.findMany({ where: scope }),
      this.prisma.product.findMany({ where: scope }),
      this.prisma.employee.findMany({ where: scope }),
      this.prisma.invoice.findMany({
        where: scope,
        include: { lines: true, payments: true },
      }),
      this.prisma.quote.findMany({ where: scope, include: { lines: true } }),
      this.prisma.salesOrder.findMany({ where: scope, include: { lines: true } }),
      this.prisma.purchaseOrder.findMany({ where: scope, include: { lines: true } }),
      this.prisma.payment.findMany({ where: { companyId } }),
      this.prisma.stockMovement.findMany({ where: { companyId } }),
    ]);

    this.audit.logAsync({
      action: 'privacy.data_exported',
      companyId,
      userId,
      entity: 'company',
      entityId: companyId,
    });

    return {
      exportedAt: new Date().toISOString(),
      format: 'domo-gdpr-export/1',
      company,
      counts: {
        users: users.length,
        clients: clients.length,
        suppliers: suppliers.length,
        products: products.length,
        employees: employees.length,
        invoices: invoices.length,
        quotes: quotes.length,
        orders: orders.length,
        purchaseOrders: purchaseOrders.length,
        payments: payments.length,
        stockMovements: stockMovements.length,
      },
      data: {
        users,
        clients,
        suppliers,
        products,
        employees,
        invoices,
        quotes,
        orders,
        purchaseOrders,
        payments,
        stockMovements,
      },
    };
  }

  /** Datos personales de un interesado concreto (RGPD art. 15, derecho de acceso). */
  async exportClientData(clientId: string, companyId: string, userId?: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
      include: {
        clientNotes: { select: { text: true, createdAt: true } },
        invoices: {
          where: { deletedAt: null },
          select: {
            number: true,
            documentType: true,
            status: true,
            issueDate: true,
            total: true,
          },
        },
        quotes: {
          where: { deletedAt: null },
          select: { number: true, status: true, quoteDate: true, total: true },
        },
        salesOrders: {
          where: { deletedAt: null },
          select: { number: true, status: true, orderDate: true, total: true },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    this.audit.logAsync({
      action: 'privacy.client_exported',
      companyId,
      userId,
      entity: 'client',
      entityId: clientId,
    });

    return {
      exportedAt: new Date().toISOString(),
      format: 'domo-gdpr-subject-export/1',
      client,
    };
  }

  /**
   * Supresión de datos personales del cliente (RGPD art. 17) conservando el
   * histórico fiscal, que no puede eliminarse por obligación legal.
   */
  async anonymizeClient(
    clientId: string,
    companyId: string,
    dto: AnonymizeClientDto,
    userId?: string,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
      select: { id: true, name: true, anonymizedAt: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (client.anonymizedAt) {
      throw new BadRequestException('El cliente ya está anonimizado');
    }

    const alias = `Cliente anonimizado ${clientId.slice(0, 8)}`;

    await this.prisma.$transaction([
      this.prisma.clientNote.deleteMany({ where: { clientId, companyId } }),
      this.prisma.client.update({
        where: { id: clientId },
        data: {
          name: alias,
          email: null,
          phone: null,
          taxId: null,
          address: null,
          city: null,
          postalCode: null,
          notes: null,
          isActive: false,
          anonymizedAt: new Date(),
        },
      }),
    ]);

    this.audit.logAsync({
      action: 'privacy.client_anonymized',
      companyId,
      userId,
      entity: 'client',
      entityId: clientId,
      metadata: { reason: dto.reason, previousName: client.name },
    });

    return {
      message: 'Datos personales del cliente suprimidos',
      alias,
      retainedForFiscalReasons: [
        'Facturas y rectificativas emitidas',
        'Asientos contables asociados',
      ],
    };
  }

  /**
   * Baja de cuenta: desactiva el tenant y anonimiza a los usuarios.
   * Los documentos fiscales se conservan durante el periodo legal de retención.
   */
  async deleteCompanyData(
    companyId: string,
    dto: DeleteCompanyDataDto,
    userId?: string,
  ) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    if (dto.confirmation.trim() !== company.name.trim()) {
      throw new BadRequestException(
        'La confirmación no coincide con el nombre de la empresa',
      );
    }

    // El registro de auditoría se escribe antes de cerrar el tenant
    await this.audit.log({
      action: 'privacy.company_data_deleted',
      companyId,
      userId,
      entity: 'company',
      entityId: companyId,
      metadata: { reason: dto.reason, companyName: company.name },
    });

    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true },
    });

    const now = new Date();
    await this.prisma.$transaction([
      ...users.map((user) => this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: `deleted-${randomUUID()}@domo.invalid`,
          firstName: null,
          lastName: null,
          isActive: false,
          deletedAt: now,
        },
      })),
      this.prisma.refreshToken.deleteMany({ where: { companyId } }),
      this.prisma.company.update({
        where: { id: companyId },
        data: { isActive: false, deletedAt: now },
      }),
    ]);

    this.logger.warn(`Baja RGPD completada para empresa ${companyId}`);

    return {
      message: 'Cuenta dada de baja y datos personales suprimidos',
      anonymizedUsers: users.length,
      fiscalRetentionYears: FISCAL_RETENTION_YEARS,
      note: 'La documentación fiscal se conserva bloqueada durante el periodo legal de retención',
    };
  }
}
