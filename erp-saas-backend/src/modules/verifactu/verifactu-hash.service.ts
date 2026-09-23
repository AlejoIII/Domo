import { Injectable } from '@nestjs/common';
import {
  buildAltaHashPayload,
  buildAnulacionHashPayload,
  computeAltaHuella,
  computeAnulacionHuella,
  formatFechaExpedicion,
  formatFechaHoraHuso,
  formatMoneyForHash,
  type VerifactuAltaHashInput,
  type VerifactuAnulacionHashInput,
} from './verifactu-hash';

@Injectable()
export class VerifactuHashService {
  formatMoney(value: number | string): string {
    return formatMoneyForHash(value);
  }

  formatFechaExpedicion(date: Date): string {
    return formatFechaExpedicion(date);
  }

  formatFechaHoraHuso(date?: Date): string {
    return formatFechaHoraHuso(date);
  }

  altaPayload(input: VerifactuAltaHashInput): string {
    return buildAltaHashPayload(input);
  }

  anulacionPayload(input: VerifactuAnulacionHashInput): string {
    return buildAnulacionHashPayload(input);
  }

  computeAlta(input: VerifactuAltaHashInput): string {
    return computeAltaHuella(input);
  }

  computeAnulacion(input: VerifactuAnulacionHashInput): string {
    return computeAnulacionHuella(input);
  }
}
