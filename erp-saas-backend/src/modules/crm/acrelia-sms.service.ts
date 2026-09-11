import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  sent: boolean;
  error?: string;
  provider?: string;
}

@Injectable()
export class AcreliaSmsService {
  private readonly logger = new Logger(AcreliaSmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendSms(params: {
    apiKey: string;
    senderId?: string | null;
    to: string;
    body: string;
  }): Promise<SmsResult> {
    const phone = params.to.replace(/\s/g, '');
    const baseUrl = this.config.get<string>(
      'ACRELIA_API_BASE_URL',
      'https://api.acrelia.com/v1',
    );

    if (this.config.get('NODE_ENV') !== 'production' && !this.config.get('ACRELIA_FORCE_SEND')) {
      this.logger.warn(`[DEV SMS] ${phone}: ${params.body}`);
      return { sent: true, provider: 'console' };
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: params.body,
          sender: params.senderId ?? undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      this.logger.log(`SMS enviado a ${phone}`);
      return { sent: true, provider: 'acrelia' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Acrelia SMS falló (${phone}): ${message}`);
      return { sent: false, provider: 'acrelia', error: message };
    }
  }
}
