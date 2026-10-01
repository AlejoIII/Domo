import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { VerifactuAeatClient } from './verifactu-aeat.client';
import { VERIFACTU_AEAT_STATUS } from './verifactu.constants';

@Injectable()
export class VerifactuRemitService {
  private readonly logger = new Logger(VerifactuRemitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aeat: VerifactuAeatClient,
  ) {}

  async processRecord(companyId: string, recordId: string): Promise<void> {
    const record = await this.prisma.verifactuRecord.findFirst({
      where: { id: recordId, companyId },
    });
    if (!record) {
      this.logger.warn(`Verifactu record missing ${recordId}`);
      return;
    }

    if (
      [
        VERIFACTU_AEAT_STATUS.ACCEPTED,
        VERIFACTU_AEAT_STATUS.ACCEPTED_WITH_ERRORS,
        VERIFACTU_AEAT_STATUS.SKIPPED,
      ].includes(record.aeatStatus as never)
    ) {
      return;
    }

    const result = await this.aeat.remitRegistro(record.xmlPayload, {
      companyId,
      recordId,
      sequenceNo: record.sequenceNo,
    });

    const statusMap: Record<string, string> = {
      accepted: VERIFACTU_AEAT_STATUS.ACCEPTED,
      accepted_with_errors: VERIFACTU_AEAT_STATUS.ACCEPTED_WITH_ERRORS,
      rejected: VERIFACTU_AEAT_STATUS.REJECTED,
      dry_run: VERIFACTU_AEAT_STATUS.DRY_RUN,
      skipped: VERIFACTU_AEAT_STATUS.SKIPPED,
    };

    await this.prisma.verifactuRecord.update({
      where: { id: recordId },
      data: {
        aeatStatus: statusMap[result.status] ?? VERIFACTU_AEAT_STATUS.REJECTED,
        aeatCsv: result.csv,
        aeatResponseXml: result.responseXml,
        aeatSentAt: new Date(),
        aeatError: result.error,
        incidenciaRemision: !result.ok,
      },
    });

    if (!result.ok) {
      throw new Error(result.error ?? `AEAT reject status=${result.status}`);
    }
  }
}
