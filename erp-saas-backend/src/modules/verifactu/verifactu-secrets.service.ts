import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * Cifrado de certificados Verifactu en reposo.
 * Requiere VERIFACTU_SECRETS_KEY (32+ chars o hex 64).
 */
@Injectable()
export class VerifactuSecretsService {
  private readonly logger = new Logger(VerifactuSecretsService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.resolveKeyMaterial();
  }

  encrypt(plaintext: string): string {
    const key = this.requireKey();
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(ciphertextB64: string): string {
    const key = this.requireKey();
    const buf = Buffer.from(ciphertextB64, 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  fingerprint(pemOrDer: string): string {
    return createHash('sha256').update(pemOrDer, 'utf8').digest('hex').slice(0, 16);
  }

  private requireKey(): Buffer {
    const material = this.resolveKeyMaterial();
    if (!material) {
      throw new Error(
        'VERIFACTU_SECRETS_KEY no configurada (mín. 32 caracteres). Necesaria para guardar certificados.',
      );
    }
    return createHash('sha256').update(material, 'utf8').digest();
  }

  private resolveKeyMaterial(): string | null {
    const key = this.config.get<string>('VERIFACTU_SECRETS_KEY')?.trim();
    if (!key || key.length < 32) {
      if (key) this.logger.warn('VERIFACTU_SECRETS_KEY demasiado corta (<32)');
      return null;
    }
    return key;
  }
}
