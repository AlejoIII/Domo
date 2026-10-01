import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UpdateVerifactuSettingsDto } from './dto/verifactu-settings.dto';
import { VerifactuSecretsService } from './verifactu-secrets.service';
import { VerifactuRecordService } from './verifactu-record.service';
import { DOMO_SIF } from './verifactu.constants';

@Injectable()
export class VerifactuSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secrets: VerifactuSecretsService,
    private readonly records: VerifactuRecordService,
  ) {}

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        verifactuEnabled: true,
        verifactuMode: true,
        verifactuNif: true,
        verifactuCertFingerprint: true,
        taxId: true,
        name: true,
      },
    });
    const chain = await this.records.getChainStatus(companyId);

    return {
      enabled: company.verifactuEnabled,
      mode: company.verifactuMode,
      nif: company.verifactuNif || company.taxId,
      hasCertificate: !!company.verifactuCertFingerprint,
      certificateFingerprint: company.verifactuCertFingerprint,
      secretsKeyConfigured: this.secrets.isConfigured(),
      software: {
        name: DOMO_SIF.nombreSistemaInformatico,
        id: DOMO_SIF.idSistemaInformatico,
        version: DOMO_SIF.version,
        nifProductor: DOMO_SIF.nifProductor,
        numeroInstalacion: DOMO_SIF.numeroInstalacion,
      },
      chain,
    };
  }

  async updateSettings(companyId: string, dto: UpdateVerifactuSettingsDto) {
    if (dto.certificatePem && !this.secrets.isConfigured()) {
      throw new BadRequestException(
        'Configura VERIFACTU_SECRETS_KEY en el servidor antes de subir el certificado',
      );
    }

    const data: Record<string, unknown> = {};
    if (dto.enabled !== undefined) data.verifactuEnabled = dto.enabled;
    if (dto.mode !== undefined) data.verifactuMode = dto.mode;
    if (dto.nif !== undefined) data.verifactuNif = dto.nif?.replace(/[\s-]/g, '').toUpperCase() || null;

    if (dto.clearCertificate) {
      data.verifactuCertPemEnc = null;
      data.verifactuCertPassEnc = null;
      data.verifactuCertFingerprint = null;
    } else if (dto.certificatePem) {
      data.verifactuCertPemEnc = this.secrets.encrypt(dto.certificatePem);
      data.verifactuCertPassEnc = dto.certificatePassword
        ? this.secrets.encrypt(dto.certificatePassword)
        : null;
      data.verifactuCertFingerprint = this.secrets.fingerprint(dto.certificatePem);
    }

    if (Object.keys(data).length === 0) {
      return this.getSettings(companyId);
    }

    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(
        `No se pudo guardar Verifactu: ${message}. ¿Aplicaste las migraciones (prisma migrate deploy)?`,
      );
    }

    return this.getSettings(companyId);
  }
}
