import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanLimitsService } from './plan-limits.service';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanFeatureException } from './plan-limit.exception';
import { DEFAULT_PLAN_FEATURES, PLAN_CODES } from './plan-features.constants';

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  const prisma = {
    company: { findFirst: jest.fn() },
    user: { count: jest.fn() },
    userInvitation: { count: jest.fn() },
    salesOrder: { count: jest.fn() },
    invoice: { count: jest.fn() },
    quote: { count: jest.fn() },
    purchaseOrder: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PlanLimitsService);
  });

  describe('resolvePlan', () => {
    it('uses premium features during active trial', () => {
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const plan = service.resolvePlan({
        trialEndsAt,
        plan: {
          code: PLAN_CODES.FREE,
          name: 'Free',
          maxUsers: 3,
          maxDocuments: 50,
          features: DEFAULT_PLAN_FEATURES[PLAN_CODES.FREE],
        },
      });

      expect(plan.code).toBe(PLAN_CODES.PREMIUM);
      expect(plan.trial).toBe(true);
      expect(plan.features.reports).toBe(true);
      expect(plan.features.pdfWatermark).toBe(false);
    });

    it('returns free plan features when no plan assigned', () => {
      const plan = service.resolvePlan({ trialEndsAt: null, plan: null });
      expect(plan.code).toBe(PLAN_CODES.FREE);
      expect(plan.features.ads).toBe(true);
      expect(plan.features.pdfWatermark).toBe(true);
    });

    it('merges stored plan features with defaults', () => {
      const plan = service.resolvePlan({
        trialEndsAt: null,
        plan: {
          code: PLAN_CODES.PREMIUM,
          name: 'Premium',
          maxUsers: 20,
          maxDocuments: 500,
          features: { reports: true, webhooks: true },
        },
      });

      expect(plan.features.reports).toBe(true);
      expect(plan.features.webhooks).toBe(true);
      expect(plan.features.api).toBe(false);
    });
  });

  describe('assertFeature', () => {
    it('throws PlanFeatureException when feature is locked', async () => {
      prisma.company.findFirst.mockResolvedValue({
        id: 'c1',
        trialEndsAt: null,
        subscriptionStatus: 'active',
        plan: {
          code: PLAN_CODES.FREE,
          name: 'Free',
          maxUsers: 3,
          maxDocuments: 50,
          features: DEFAULT_PLAN_FEATURES[PLAN_CODES.FREE],
        },
      });

      await expect(service.assertFeature('c1', 'reports')).rejects.toBeInstanceOf(
        PlanFeatureException,
      );
    });

    it('passes when feature is enabled', async () => {
      prisma.company.findFirst.mockResolvedValue({
        id: 'c1',
        trialEndsAt: null,
        subscriptionStatus: 'active',
        plan: {
          code: PLAN_CODES.ENTERPRISE,
          name: 'Enterprise',
          maxUsers: 999,
          maxDocuments: null,
          features: DEFAULT_PLAN_FEATURES[PLAN_CODES.ENTERPRISE],
        },
      });

      await expect(service.assertFeature('c1', 'reports')).resolves.toBeUndefined();
    });
  });

  describe('getCompanyWithPlan', () => {
    it('throws when company is missing', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.getCompanyWithPlan('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
