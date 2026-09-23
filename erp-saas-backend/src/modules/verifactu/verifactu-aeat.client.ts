import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VERIFACTU_QR_BASE_URL } from './verifactu.constants';

export interface AeatRemitResult {
  ok: boolean;
  status: 'accepted' | 'accepted_with_errors' | 'rejected' | 'dry_run' | 'skipped';
  csv?: string;
  responseXml?: string;
  error?: string;
  waitSeconds?: number;
}

/**
 * Cliente SOAP AEAT (esqueleto).
 * En dry-run / deshabilitado no llama a la red; solo registra la intención.
 * La integración real usará certificado cliente mTLS + XSD oficiales.
 */
@Injectable()
export class VerifactuAeatClient {
  private readonly logger = new Logger(VerifactuAeatClient.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<string>('VERIFACTU_AEAT_ENABLED', 'false') === 'true';
  }

  isDryRun(): boolean {
    return this.config.get<string>('VERIFACTU_AEAT_DRY_RUN', 'true') !== 'false';
  }

  endpoint(): string {
    const env = this.config.get<string>('VERIFACTU_AEAT_ENV', 'pre');
    if (env === 'prod') {
      return (
        this.config.get<string>('VERIFACTU_AEAT_URL_PROD') ??
        'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'
      );
    }
    return (
      this.config.get<string>('VERIFACTU_AEAT_URL_PRE') ??
      'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'
    );
  }

  buildQrUrl(params: {
    nif: string;
    numSerie: string;
    fecha: string;
    importe: string;
  }): string {
    const base = this.config.get<string>('VERIFACTU_QR_BASE_URL', VERIFACTU_QR_BASE_URL);
    const qs = new URLSearchParams({
      nif: params.nif,
      numserie: params.numSerie,
      fecha: params.fecha,
      importe: params.importe,
    });
    return `${base}?${qs.toString()}`;
  }

  async remitRegistro(xmlPayload: string, meta: {
    companyId: string;
    recordId: string;
    sequenceNo: number;
  }): Promise<AeatRemitResult> {
    if (!this.isEnabled()) {
      this.logger.debug(
        `AEAT disabled — skip remit company=${meta.companyId} record=${meta.recordId}`,
      );
      return { ok: true, status: 'skipped' };
    }

    if (this.isDryRun()) {
      this.logger.log(
        `AEAT dry-run seq=${meta.sequenceNo} company=${meta.companyId} endpoint=${this.endpoint()} bytes=${xmlPayload.length}`,
      );
      return {
        ok: true,
        status: 'dry_run',
        csv: `DRY-RUN-${meta.recordId.slice(0, 8)}`,
        waitSeconds: 60,
      };
    }

    // TODO: SOAP mTLS con certificado de la empresa + parseo de respuesta AEAT
    this.logger.warn(
      `AEAT live remit not implemented yet (record=${meta.recordId}). Enable dry-run until SOAP client lands.`,
    );
    return {
      ok: false,
      status: 'rejected',
      error: 'Cliente SOAP AEAT aún no implementado; usar VERIFACTU_AEAT_DRY_RUN=true',
    };
  }
}
