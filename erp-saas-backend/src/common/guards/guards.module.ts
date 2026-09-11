import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PlanFeatureGuard } from './plan-feature.guard';

@Global()
@Module({
  providers: [PermissionsGuard, PlanFeatureGuard],
  exports: [PermissionsGuard, PlanFeatureGuard],
})
export class GuardsModule {}
