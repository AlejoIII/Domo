import { Global, Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlanLimitsService } from './plan-limits.service';
import { StripeService } from './stripe.service';

@Global()
@Module({
  controllers: [BillingController],
  providers: [BillingService, PlanLimitsService, StripeService],
  exports: [PlanLimitsService, BillingService, StripeService],
})
export class BillingModule {}
