import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  DEFAULT_PLAN_FEATURES,
  DEFAULT_PLAN_LIMITS,
  PLAN_CODES,
  PLAN_UPGRADE_HINT,
  TRIAL_PLAN_FEATURES,
  type PlanFeatures,
} from './plan-features.constants';
import { PlanFeatureException, PlanLimitException } from './plan-limit.exception';

type CompanyWithPlan = {
  trialEndsAt?: Date | null;
  plan: {
    code: string;
    name: string;
    maxUsers: number;
    maxDocuments: number | null;
    features: unknown;
  } | null;
};

export type ResolvedPlan = {
  code: string;
  name: string;
  maxUsers: number;
  maxDocuments: number | null;
  features: PlanFeatures;
  trial: boolean;
};

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  private monthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  async getCompanyWithPlan(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  isTrialActive(trialEndsAt?: Date | null): boolean {
    return !!trialEndsAt && trialEndsAt > new Date();
  }

  resolvePlan(company: CompanyWithPlan): ResolvedPlan {
    if (this.isTrialActive(company.trialEndsAt)) {
      const premium = DEFAULT_PLAN_LIMITS[PLAN_CODES.PREMIUM];
      return {
        code: PLAN_CODES.PREMIUM,
        name: premium.name,
        maxUsers: premium.maxUsers,
        maxDocuments: premium.maxDocuments,
        features: { ...TRIAL_PLAN_FEATURES },
        trial: true,
      };
    }

    if (company.plan) {
      const defaults = DEFAULT_PLAN_FEATURES[company.plan.code] ?? {};
      const stored = (company.plan.features ?? {}) as PlanFeatures;
      return {
        code: company.plan.code,
        name: company.plan.name,
        maxUsers: company.plan.maxUsers,
        maxDocuments: company.plan.maxDocuments,
        features: { ...defaults, ...stored },
        trial: false,
      };
    }

    const free = DEFAULT_PLAN_LIMITS[PLAN_CODES.FREE];
    return {
      code: PLAN_CODES.FREE,
      name: free.name,
      maxUsers: free.maxUsers,
      maxDocuments: free.maxDocuments,
      features: { ...DEFAULT_PLAN_FEATURES[PLAN_CODES.FREE] },
      trial: false,
    };
  }

  async countUsers(companyId: string) {
    const [users, invitations] = await Promise.all([
      this.prisma.user.count({ where: { companyId, deletedAt: null, isActive: true } }),
      this.prisma.userInvitation.count({
        where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);
    return users + invitations;
  }

  async countDocumentsThisMonth(companyId: string) {
    const createdAt = { gte: this.monthStart() };
    const where = { companyId, deletedAt: null, createdAt };
    const [orders, invoices, quotes, purchaseOrders] = await Promise.all([
      this.prisma.salesOrder.count({ where }),
      this.prisma.invoice.count({ where }),
      this.prisma.quote.count({ where }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return orders + invoices + quotes + purchaseOrders;
  }

  async getUsage(companyId: string) {
    const company = await this.getCompanyWithPlan(companyId);
    const plan = this.resolvePlan(company);
    const [users, documentsThisMonth] = await Promise.all([
      this.countUsers(companyId),
      this.countDocumentsThisMonth(companyId),
    ]);

    return {
      plan: {
        code: plan.code,
        name: plan.trial ? `${plan.name} (trial)` : plan.name,
        maxUsers: plan.maxUsers,
        maxDocuments: plan.maxDocuments,
        features: plan.features,
        trial: plan.trial,
      },
      subscriptionStatus: company.subscriptionStatus,
      trialEndsAt: company.trialEndsAt,
      onboardingCompleted: company.onboardingCompleted,
      usage: {
        users,
        documentsThisMonth,
      },
    };
  }

  async assertCanAddUser(companyId: string) {
    const company = await this.getCompanyWithPlan(companyId);
    const plan = this.resolvePlan(company);
    const current = await this.countUsers(companyId);
    if (current >= plan.maxUsers) {
      throw new PlanLimitException(
        'PLAN_LIMIT_USERS',
        `Has alcanzado el límite de ${plan.maxUsers} usuarios del plan ${plan.name}`,
        plan.maxUsers,
        current,
      );
    }
  }

  hasFeature(features: PlanFeatures, feature: string): boolean {
    return features[feature] === true;
  }

  async assertFeature(companyId: string, feature: string) {
    const company = await this.getCompanyWithPlan(companyId);
    const plan = this.resolvePlan(company);
    if (this.hasFeature(plan.features, feature)) return;

    const upgradePlan = PLAN_UPGRADE_HINT[feature] ?? 'superior';
    throw new PlanFeatureException(feature, upgradePlan);
  }

  async assertCanCreateDocument(companyId: string) {
    const company = await this.getCompanyWithPlan(companyId);
    const plan = this.resolvePlan(company);
    if (plan.maxDocuments == null) return;

    const current = await this.countDocumentsThisMonth(companyId);
    if (current >= plan.maxDocuments) {
      throw new PlanLimitException(
        'PLAN_LIMIT_DOCUMENTS',
        `Has alcanzado el límite de ${plan.maxDocuments} documentos este mes (plan ${plan.name})`,
        plan.maxDocuments,
        current,
      );
    }
  }
}
