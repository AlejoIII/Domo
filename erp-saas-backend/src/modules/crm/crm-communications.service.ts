import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import { AcreliaSmsService } from './acrelia-sms.service';
import { SendCrmEmailDto, SendCrmSmsDto } from './dto/crm-communication.dto';
import { CrmActivitiesService } from './crm-activities.service';

interface TemplateContext {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
}

@Injectable()
export class CrmCommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly acrelia: AcreliaSmsService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async sendEmail(companyId: string, userId: string, dto: SendCrmEmailDto) {
    const context = await this.resolveContext(companyId, dto);
    const settings = await this.prisma.crmEmailSettings.findUnique({
      where: { companyId },
    });

    let subject = dto.subject ?? '';
    let bodyHtml = dto.bodyHtml ?? '';

    if (dto.templateId) {
      const template = await this.prisma.crmEmailTemplate.findFirst({
        where: { id: dto.templateId, companyId, isActive: true },
      });
      if (!template) throw new NotFoundException('Plantilla de email no encontrada');
      subject = subject || template.subject;
      bodyHtml = bodyHtml || template.bodyHtml;
    } else if (settings?.defaultEmailTemplateId) {
      const template = await this.prisma.crmEmailTemplate.findFirst({
        where: { id: settings.defaultEmailTemplateId, companyId, isActive: true },
      });
      if (template) {
        subject = subject || template.subject;
        bodyHtml = bodyHtml || template.bodyHtml;
      }
    }

    if (!subject.trim() || !bodyHtml.trim()) {
      throw new BadRequestException('Indica asunto y cuerpo o selecciona una plantilla');
    }

    subject = this.applyTemplate(subject, context);
    bodyHtml = this.applyTemplate(bodyHtml, context);

    if (settings?.signatureHtml) {
      bodyHtml = `${bodyHtml}<br><br>${this.applyTemplate(settings.signatureHtml, context)}`;
    }

    const text = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    this.queue.enqueueCustomEmail({
      to: dto.to,
      subject,
      text,
      html: bodyHtml,
      from: settings?.fromEmail
        ? settings.fromName
          ? `${settings.fromName} <${settings.fromEmail}>`
          : settings.fromEmail
        : undefined,
      replyTo: settings?.replyTo ?? undefined,
      bcc: settings?.copyTo ?? undefined,
    });

    await this.logEmailActivity(companyId, userId, dto, subject);

    return { message: 'Email encolado para envío', to: dto.to, queued: true };
  }

  async sendSms(companyId: string, userId: string, dto: SendCrmSmsDto) {
    const context = await this.resolveContext(companyId, dto);
    let body = dto.body ?? '';

    if (dto.templateId) {
      const template = await this.prisma.crmSmsTemplate.findFirst({
        where: { id: dto.templateId, companyId, isActive: true },
      });
      if (!template) throw new NotFoundException('Plantilla SMS no encontrada');
      body = body || template.body;
    }

    if (!body.trim()) {
      throw new BadRequestException('Indica el mensaje o selecciona una plantilla');
    }

    body = this.applyTemplate(body, context);

    const account = await this.resolveAcreliaAccount(companyId, dto.acreliaAccountId);
    if (!account?.apiKey) {
      throw new BadRequestException('Configura una cuenta Acrelia activa con API key');
    }

    const result = await this.acrelia.sendSms({
      apiKey: account.apiKey,
      senderId: account.senderId,
      to: dto.to,
      body,
    });

    if (!result.sent) {
      throw new BadRequestException(result.error ?? 'No se pudo enviar el SMS');
    }

    await this.logSmsActivity(companyId, userId, dto, body);

    return { message: 'SMS enviado', to: dto.to, provider: result.provider };
  }

  private applyTemplate(template: string, context: TemplateContext) {
    return template
      .replace(/\{\{nombre\}\}/gi, context.nombre)
      .replace(/\{\{empresa\}\}/gi, context.empresa)
      .replace(/\{\{email\}\}/gi, context.email)
      .replace(/\{\{telefono\}\}/gi, context.telefono);
  }

  private async resolveContext(
    companyId: string,
    dto: { leadId?: string; clientId?: string; opportunityId?: string },
  ): Promise<TemplateContext> {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { name: true },
    });

    let context: TemplateContext = {
      nombre: '',
      empresa: company.name,
      email: '',
      telefono: '',
    };

    if (dto.leadId) {
      const lead = await this.prisma.crmLead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (lead) {
        context = {
          nombre: lead.name,
          empresa: lead.companyName ?? company.name,
          email: lead.email ?? '',
          telefono: lead.phone ?? '',
        };
      }
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, companyId },
      });
      if (client) {
        context = {
          nombre: client.name,
          empresa: company.name,
          email: client.email ?? context.email,
          telefono: client.phone ?? context.telefono,
        };
      }
    }

    if (dto.opportunityId) {
      const opp = await this.prisma.crmOpportunity.findFirst({
        where: { id: dto.opportunityId, companyId },
        include: { client: true, lead: true },
      });
      if (opp) {
        context = {
          nombre: opp.client?.name ?? opp.lead?.name ?? opp.title,
          empresa: opp.lead?.companyName ?? company.name,
          email: opp.client?.email ?? opp.lead?.email ?? context.email,
          telefono: opp.client?.phone ?? opp.lead?.phone ?? context.telefono,
        };
      }
    }

    return context;
  }

  private async resolveAcreliaAccount(companyId: string, accountId?: string) {
    if (accountId) {
      return this.prisma.crmAcreliaAccount.findFirst({
        where: { id: accountId, companyId, isActive: true },
      });
    }
    return this.prisma.crmAcreliaAccount.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async logEmailActivity(
    companyId: string,
    userId: string,
    dto: SendCrmEmailDto,
    subject: string,
  ) {
    await this.activities.create(
      companyId,
      {
        type: 'email',
        subject: `Email: ${subject}`,
        leadId: dto.leadId,
        clientId: dto.clientId,
        opportunityId: dto.opportunityId,
      },
      userId,
    );
  }

  private async logSmsActivity(
    companyId: string,
    userId: string,
    dto: SendCrmSmsDto,
    body: string,
  ) {
    await this.activities.create(
      companyId,
      {
        type: 'sms',
        subject: `SMS: ${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`,
        leadId: dto.leadId,
        clientId: dto.clientId,
        opportunityId: dto.opportunityId,
      },
      userId,
    );
  }
}
