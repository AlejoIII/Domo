import { ForbiddenException } from '@nestjs/common';

export type PlanLimitCode =
  | 'PLAN_LIMIT_USERS'
  | 'PLAN_LIMIT_DOCUMENTS'
  | 'PLAN_FEATURE_LOCKED';

export class PlanLimitException extends ForbiddenException {
  constructor(
    public readonly code: 'PLAN_LIMIT_USERS' | 'PLAN_LIMIT_DOCUMENTS',
    message: string,
    public readonly limit: number | null,
    public readonly current: number,
  ) {
    super({ message, code, limit, current });
  }
}

export class PlanFeatureException extends ForbiddenException {
  constructor(
    public readonly feature: string,
    upgradePlan: string,
  ) {
    super({
      message: `Esta función requiere el plan ${upgradePlan}`,
      code: 'PLAN_FEATURE_LOCKED' satisfies PlanLimitCode,
      feature,
      upgradePlan,
    });
  }
}
