import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface EmailResult {
  sent: boolean;
  error?: string;
  provider?: string;
}

export interface EmailStatus {
  configured: boolean;
  provider: string;
  verificationEnabled: boolean;
}

type EmailProvider = 'smtp' | 'resend' | 'console';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  getStatus(): EmailStatus {
    return {
      configured: this.isConfigured(),
      provider: this.getProvider(),
      verificationEnabled: this.config.get('EMAIL_VERIFICATION_ENABLED') === 'true',
    };
  }

  isConfigured(): boolean {
    const provider = this.getProvider();
    if (provider === 'console') return this.config.get('NODE_ENV') !== 'production';
    return provider === 'smtp' || provider === 'resend';
  }

  async sendVerificationCode(email: string, code: string): Promise<EmailResult> {
    const subject = 'Tu código de verificación en Domo';
    const text = `Tu código de verificación en Domo es: ${code}\n\nExpira en 15 minutos.`;
    const html = `
      <h2>Bienvenido a Domo</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
      <p>Expira en 15 minutos.</p>
    `;

    const result = await this.sendMail(email, subject, text, html);

    if (!result.sent && this.config.get('NODE_ENV') !== 'production') {
      this.logger.warn(`[DEV] Código para ${email}: ${code}`);
    }

    return result;
  }

  async sendInvitation(
    email: string,
    inviteUrl: string,
    companyName: string,
  ): Promise<EmailResult> {
    const subject = `Invitación a ${companyName} en Domo`;
    const text = [
      `Has sido invitado a unirte a ${companyName} en Domo.`,
      '',
      `Acepta la invitación aquí: ${inviteUrl}`,
      '',
      'El enlace expira en 7 días.',
    ].join('\n');
    const html = `
      <h2>Invitación a Domo</h2>
      <p>Has sido invitado a unirte a <strong>${companyName}</strong>.</p>
      <p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
          Aceptar invitación
        </a>
      </p>
      <p style="font-size:12px;color:#666;">Si el botón no funciona, copia este enlace:<br>${inviteUrl}</p>
      <p style="font-size:12px;color:#666;">El enlace expira en 7 días.</p>
    `;

    const result = await this.sendMail(email, subject, text, html);

    if (!result.sent) {
      this.logger.warn(`[DEV] Invitación para ${email}: ${inviteUrl}`);
    }

    return result;
  }

  async sendPasswordResetLink(email: string, resetUrl: string): Promise<EmailResult> {
    const subject = 'Restablecer contraseña en Domo';
    const text = [
      'Recibimos una solicitud para restablecer tu contraseña en Domo.',
      '',
      `Restablece tu contraseña aquí: ${resetUrl}`,
      '',
      'El enlace expira en 1 hora.',
      'Si no solicitaste este cambio, ignora este email.',
    ].join('\n');
    const html = `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña en Domo.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size:12px;color:#666;">Si el botón no funciona, copia este enlace:<br>${resetUrl}</p>
      <p style="font-size:12px;color:#666;">El enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
    `;

    const result = await this.sendMail(email, subject, text, html);

    if (!result.sent) {
      this.logger.warn(`[DEV] Reset password para ${email}: ${resetUrl}`);
    }

    return result;
  }

  async sendCustomEmail(params: {
    to: string;
    subject: string;
    text: string;
    html: string;
    from?: string;
    replyTo?: string;
    bcc?: string;
  }): Promise<EmailResult> {
    const provider = this.getProvider();
    this.logger.log(`Enviando email CRM a ${params.to} (${provider})`);

    if (provider === 'console') {
      this.logger.warn(`[CONSOLE CRM] ${params.subject} → ${params.to}\n${params.text}`);
      return { sent: true, provider: 'console' };
    }

    if (provider === 'resend') {
      return this.sendViaResend(
        params.to,
        params.subject,
        params.html,
        params.from,
        params.replyTo,
        params.bcc,
      );
    }

    return this.sendViaSmtp(
      params.to,
      params.subject,
      params.text,
      params.html,
      params.from,
      params.replyTo,
      params.bcc,
    );
  }

  async sendDocumentLink(params: {
    to: string;
    documentType: 'quote' | 'invoice';
    documentNumber: string;
    companyName: string;
    printUrl: string;
  }): Promise<EmailResult> {
    const label = params.documentType === 'quote' ? 'Presupuesto' : 'Factura';
    const subject = `${label} ${params.documentNumber} — ${params.companyName}`;
    const text = [
      `${params.companyName} te envía ${label.toLowerCase()} ${params.documentNumber}.`,
      '',
      `Ver e imprimir: ${params.printUrl}`,
    ].join('\n');
    const html = `
      <h2>${label} ${params.documentNumber}</h2>
      <p><strong>${params.companyName}</strong> te ha enviado un documento.</p>
      <p>
        <a href="${params.printUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
          Ver ${label.toLowerCase()}
        </a>
      </p>
      <p style="font-size:12px;color:#666;">También puedes abrir este enlace:<br>${params.printUrl}</p>
    `;

    const result = await this.sendMail(params.to, subject, text, html);

    if (!result.sent) {
      this.logger.warn(`[DEV] ${label} ${params.documentNumber} → ${params.to}: ${params.printUrl}`);
    }

    return result;
  }

  private async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
    from?: string,
    replyTo?: string,
    bcc?: string,
  ): Promise<EmailResult> {
    const provider = this.getProvider();
    this.logger.log(`Enviando email a ${to} (${provider})`);

    let result: EmailResult;

    switch (provider) {
      case 'resend':
        result = await this.sendViaResend(to, subject, html, from, replyTo, bcc);
        break;
      case 'console':
        result = this.sendViaConsole(to, subject, text);
        break;
      default:
        result = await this.sendViaSmtp(to, subject, text, html, from, replyTo, bcc);
    }

    return { ...result, provider };
  }

  /** Used by async job worker for queued outbound mail. */
  sendRawMail(to: string, subject: string, text: string, html: string): Promise<EmailResult> {
    return this.sendMail(to, subject, text, html);
  }

  private getProvider(): EmailProvider {
    const configured = this.config.get<string>('EMAIL_PROVIDER', 'smtp').toLowerCase();
    if (configured === 'resend' && this.config.get('RESEND_API_KEY')) return 'resend';
    if (configured === 'console') return 'console';
    if (this.hasSmtpConfig()) return 'smtp';
    if (this.config.get('NODE_ENV') !== 'production') return 'console';
    return 'smtp';
  }

  private hasSmtpConfig(): boolean {
    return Boolean(
      this.config.get('SMTP_HOST')?.trim() &&
        this.config.get('SMTP_USER')?.trim() &&
        this.config.get('SMTP_PASS')?.trim(),
    );
  }

  private sendViaConsole(to: string, subject: string, text: string): EmailResult {
    this.logger.warn(`[CONSOLE] ${subject} → ${to}\n${text}`);
    return { sent: true, provider: 'console' };
  }

  private async sendViaSmtp(
    to: string,
    subject: string,
    text: string,
    html: string,
    from?: string,
    replyTo?: string,
    bcc?: string,
  ): Promise<EmailResult> {
    if (!this.hasSmtpConfig()) {
      return {
        sent: false,
        provider: 'smtp',
        error: 'SMTP no configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS.',
      };
    }

    const smtpUser = this.config.get<string>('SMTP_USER')!.trim();
    const smtpPass = this.config.get<string>('SMTP_PASS')!.replace(/\s/g, '');
    const smtpHost = this.config.get<string>('SMTP_HOST')!.trim();
    const port = Number(this.config.get('SMTP_PORT', 587));
    const secure = this.config.get('SMTP_SECURE') === 'true';

    const transportOptions: SMTPTransport.Options =
      smtpHost.includes('gmail')
        ? { service: 'gmail', auth: { user: smtpUser, pass: smtpPass } }
        : {
            host: smtpHost,
            port,
            secure,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: this.config.get('SMTP_TLS_REJECT') !== 'false' },
          };

    try {
      const transporter = nodemailer.createTransport(transportOptions);
      await transporter.sendMail({
        from: from ?? this.config.get('SMTP_FROM', `Domo <${smtpUser}>`),
        to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
        ...(bcc ? { bcc } : {}),
      });

      this.logger.log(`Email enviado a ${to}`);
      return { sent: true, provider: 'smtp' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`SMTP falló (${to}): ${message}`);
      return {
        sent: false,
        provider: 'smtp',
        error: this.humanizeSmtpError(message),
      };
    }
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    from?: string,
    replyTo?: string,
    bcc?: string,
  ): Promise<EmailResult> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const defaultFrom = this.config.get('RESEND_FROM', 'Domo <onboarding@resend.dev>');

    if (!apiKey) {
      return { sent: false, provider: 'resend', error: 'RESEND_API_KEY no configurada' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from ?? defaultFrom,
          to: [to],
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
          ...(bcc ? { bcc: [bcc] } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || res.statusText);
      }

      this.logger.log(`Resend: email enviado a ${to}`);
      return { sent: true, provider: 'resend' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Resend falló (${to}): ${message}`);
      return { sent: false, provider: 'resend', error: message };
    }
  }

  private humanizeSmtpError(message: string): string {
    if (message.includes('Invalid login') || message.includes('535')) {
      return 'Credenciales SMTP incorrectas. Gmail: usa contraseña de aplicación. Brevo: usa la clave SMTP (xsmtpsib-...).';
    }
    if (message.includes('ECONNECTION') || message.includes('ETIMEDOUT')) {
      return 'No se pudo conectar al servidor SMTP. Revisa SMTP_HOST y SMTP_PORT.';
    }
    return message;
  }
}
