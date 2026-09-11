import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import {
  PDF_WATERMARK_UPGRADE_PLAN,
  PLAN_FEATURE_KEYS,
  PRINT_WATERMARK_TEXT,
} from './plan-features.constants';
import { PlanLimitsService } from './plan-limits.service';
import { StripeService } from './stripe.service';
import { isValidStripePriceId } from './stripe.config';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  isDemoPlanSwitchEnabled(): boolean {
    const explicit = this.config.get<string>('BILLING_ALLOW_PLAN_SWITCH');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    // En desarrollo siempre permitir cambio manual (aunque Stripe esté configurado)
    if (this.config.get<string>('NODE_ENV') !== 'production') return true;
    return !this.stripe.isEnabled();
  }

  getUsage(companyId: string) {
    return this.planLimits.getUsage(companyId);
  }

  async getPrintBranding(companyId: string) {
    const company = await this.planLimits.getCompanyWithPlan(companyId);
    const plan = this.planLimits.resolvePlan(company);
    const pdfWatermark = this.planLimits.hasFeature(
      plan.features,
      PLAN_FEATURE_KEYS.pdfWatermark,
    );

    return {
      planCode: plan.code,
      planName: plan.trial ? `${plan.name} (trial)` : plan.name,
      trial: plan.trial,
      pdfWatermark,
      watermarkText: pdfWatermark ? PRINT_WATERMARK_TEXT : null,
      upgradePlan: pdfWatermark ? PDF_WATERMARK_UPGRADE_PLAN : null,
    };
  }

  async getStatus(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    return {
      stripeEnabled: this.stripe.isEnabled(),
      hasStripeCustomer: !!company?.stripeCustomerId,
      hasActiveSubscription: !!company?.stripeSubscriptionId,
      subscriptionStatus: company?.subscriptionStatus ?? 'active',
      demoPlanSwitchEnabled: this.isDemoPlanSwitchEnabled(),
    };
  }

  async switchDemoPlan(companyId: string, planCode: string) {
    if (!this.isDemoPlanSwitchEnabled()) {
      throw new ForbiddenException('El cambio manual de plan no está habilitado');
    }

    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        planId: plan.id,
        trialEndsAt: null,
        subscriptionStatus: 'active',
      },
    });

    this.cacheInvalidation.onSettingsChanged(companyId);

    const usage = await this.getUsage(companyId);
    return {
      message: `Plan cambiado a ${plan.name}`,
      planCode: plan.code,
      planName: plan.name,
      usage,
    };
  }

  listPlans() {
    return this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        maxUsers: true,
        maxDocuments: true,
        features: true,
        sortOrder: true,
        stripePriceId: true,
      },
    }).then((plans) =>
      plans.map(({ stripePriceId, ...plan }) => ({
        ...plan,
        purchasable: this.stripe.isEnabled()
          && isValidStripePriceId(stripePriceId)
          && plan.code !== 'free',
      })),
    );
  }

  createCheckout(companyId: string, planCode: string, customerEmail: string) {
    if (planCode === 'free') {
      throw new BadRequestException('El plan Free no requiere pago');
    }
    return this.stripe.createCheckoutSession({ companyId, planCode, customerEmail });
  }

  createPortal(companyId: string) {
    return this.stripe.createPortalSession(companyId);
  }

  syncSubscription(companyId: string) {
    return this.stripe.syncSubscriptionForCompany(companyId);
  }
}
