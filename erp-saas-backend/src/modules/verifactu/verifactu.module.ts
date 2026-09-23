import { Module } from '@nestjs/common';
import { VerifactuController } from './verifactu.controller';
import { VerifactuHashService } from './verifactu-hash.service';
import { VerifactuAeatClient } from './verifactu-aeat.client';
import { VerifactuSecretsService } from './verifactu-secrets.service';
import { VerifactuRecordService } from './verifactu-record.service';
import { VerifactuRemitService } from './verifactu-remit.service';
import { VerifactuSettingsService } from './verifactu-settings.service';

@Module({
  controllers: [VerifactuController],
  providers: [
    VerifactuHashService,
    VerifactuAeatClient,
    VerifactuSecretsService,
    VerifactuRecordService,
    VerifactuRemitService,
    VerifactuSettingsService,
  ],
  exports: [VerifactuRecordService, VerifactuRemitService, VerifactuHashService],
})
export class VerifactuModule {}
