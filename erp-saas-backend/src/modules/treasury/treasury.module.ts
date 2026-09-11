import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryAccountsService } from './treasury-accounts.service';
import { TreasuryMovementsService } from './treasury-movements.service';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';

@Module({
  controllers: [TreasuryController],
  providers: [
    TreasuryAccountsService,
    TreasuryMovementsService,
    TreasuryReconciliationService,
  ],
  exports: [TreasuryAccountsService, TreasuryMovementsService],
})
export class TreasuryModule {}
