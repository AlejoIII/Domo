import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { PLAN_FEATURE_KEY } from '../decorators/plan-feature.decorator';
import { PlanLimitsService } from '../../modules/billing/plan-limits.service';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(PLAN_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId as string | undefined;
    if (!companyId) throw new ForbiddenException('No autorizado');

    const planLimits = this.moduleRef.get(PlanLimitsService, { strict: false });
    await planLimits.assertFeature(companyId, feature);
    return true;
  }
}
