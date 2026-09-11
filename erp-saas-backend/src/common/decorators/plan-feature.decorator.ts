import { SetMetadata } from '@nestjs/common';

export const PLAN_FEATURE_KEY = 'plan_feature';

/** Endpoint requires an enabled plan feature (checked server-side) */
export const RequirePlanFeature = (feature: string) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);
