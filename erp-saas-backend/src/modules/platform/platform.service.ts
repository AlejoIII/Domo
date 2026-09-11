import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { RedisService } from '../../common/redis/redis.service';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { PlatformAuditService } from './platform-audit.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { BetaService } from '../beta/beta.service';
import { FeedbackService } from '../feedback/feedback.service';
import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPrefs,
} from '../../common/notification-prefs';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly audit: PlatformAuditService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly webhooks: WebhookDispatcherService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly beta: BetaService,
    private readonly feedback: FeedbackService,
  ) {}

  async listCompanies(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          isActive: true,
          subscriptionStatus: true,
          onboardingCompleted: true,
          betaCohort: true,
          createdAt: true,
          plan: { select: { code: true, name: true } },
          _count: {
            select: { users: { where: { deletedAt: null, isActive: true } } },
          },
          users: {
            where: { deletedAt: null, isActive: true },
            select: { lastLoginAt: true },
            orderBy: { lastLoginAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        email: c.email,
        isActive: c.isActive,
        subscriptionStatus: c.subscriptionStatus,
        onboardingCompleted: c.onboardingCompleted,
        betaCohort: c.betaCohort,
        planCode: c.plan?.code ?? 'free',
        planName: c.plan?.name ?? 'Free',
        userCount: c._count.users,
        lastLoginAt: c.users[0]?.lastLoginAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCompany(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        plan: true,
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            isPlatformAdmin: true,
            lastLoginAt: true,
            role: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const usage = await this.planLimits.getUsage(id);

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      email: company.email,
      isActive: company.isActive,
      subscriptionStatus: company.subscriptionStatus,
      onboardingCompleted: company.onboardingCompleted,
      betaCohort: company.betaCohort,
      trialEndsAt: company.trialEndsAt?.toISOString() ?? null,
      platformNotes: company.platformNotes,
      stripeCustomerId: company.stripeCustomerId,
      stripeSubscriptionId: company.stripeSubscriptionId,
      plan: company.plan
        ? { id: company.plan.id, code: company.plan.code, name: company.plan.name }
        : null,
      users: company.users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      })),
      usage,
      createdAt: company.createdAt.toISOString(),
    };
  }

  async setCompanyActive(actorId: string, id: string, isActive: boolean) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    await this.prisma.company.update({ where: { id }, data: { isActive } });
    await this.audit.log({
      actorUserId: actorId,
      action: isActive ? 'company.reactivate' : 'company.suspend',
      targetType: 'company',
      targetId: id,
      metadata: { name: company.name },
    });

    return { id, isActive, message: isActive ? 'Empresa reactivada' : 'Empresa suspendida' };
  }

  async updateCompanyPlan(actorId: string, id: string, planCode: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const company = await this.prisma.company.update({
      where: { id },
      data: { planId: plan.id },
      select: { id: true, name: true },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'company.plan_change',
      targetType: 'company',
      targetId: id,
      metadata: { planCode, companyName: company.name },
    });

    return { id, planCode, planName: plan.name };
  }

  async updateCompanyTrial(actorId: string, id: string, trialEndsAt: string) {
    const company = await this.prisma.company.update({
      where: { id },
      data: { trialEndsAt: new Date(trialEndsAt) },
      select: { id: true, name: true },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'company.trial_extend',
      targetType: 'company',
      targetId: id,
      metadata: { trialEndsAt, companyName: company.name },
    });

    return { id, trialEndsAt };
  }

  async updateCompanyNotes(actorId: string, id: string, platformNotes: string | undefined) {
    await this.prisma.company.update({
      where: { id },
      data: { platformNotes: platformNotes ?? null },
    });
    await this.audit.log({
      actorUserId: actorId,
      action: 'company.notes_update',
      targetType: 'company',
      targetId: id,
    });
    return { id, platformNotes: platformNotes ?? null };
  }

  async searchUsers(search: string) {
    const q = search.trim();
    if (q.length < 2) return [];

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        email: { contains: q, mode: 'insensitive' },
      },
      take: 30,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isPlatformAdmin: true,
        lastLoginAt: true,
        company: { select: { id: true, name: true, isActive: true } },
      },
      orderBy: { email: 'asc' },
    }).then((rows) =>
      rows.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      })),
    );
  }

  async setUserActive(actorId: string, userId: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.isPlatformAdmin) {
      throw new BadRequestException('No se puede desactivar un platform admin');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { isActive } });
    await this.audit.log({
      actorUserId: actorId,
      action: isActive ? 'user.activate' : 'user.deactivate',
      targetType: 'user',
      targetId: userId,
      metadata: { email: user.email },
    });

    return { id: userId, isActive };
  }

  async impersonate(actorId: string, companyId: string, userId?: string) {
    let target = userId
      ? await this.prisma.user.findFirst({
          where: { id: userId, companyId, deletedAt: null, isActive: true },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        })
      : null;

    if (!target) {
      target = await this.prisma.user.findFirst({
        where: {
          companyId,
          deletedAt: null,
          isActive: true,
          role: { name: { equals: 'admin', mode: 'insensitive' } },
        },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
    }

    if (!target) {
      target = await this.prisma.user.findFirst({
        where: { companyId, deletedAt: null, isActive: true },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
    }

    if (!target) throw new NotFoundException('No hay usuario activo en esa empresa');

    const companyMeta = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: {
        name: true,
        onboardingCompleted: true,
        subscriptionStatus: true,
        plan: { select: { code: true, name: true } },
      },
    });

    const tokens = await this.issueTokens(target.id, target.email, target.companyId);
    const permissions = target.role?.permissions.map((rp) => rp.permission.name) ?? [];

    await this.audit.log({
      actorUserId: actorId,
      action: 'impersonate.start',
      targetType: 'user',
      targetId: target.id,
      metadata: { email: target.email, companyId, companyName: companyMeta?.name },
    });

    return {
      ...tokens,
      impersonating: true,
      user: {
        id: target.id,
        email: target.email,
        firstName: target.firstName,
        lastName: target.lastName,
        companyId: target.companyId,
        companyName: companyMeta?.name,
        emailVerified: target.emailVerified,
        onboardingCompleted: companyMeta?.onboardingCompleted ?? false,
        subscriptionStatus: companyMeta?.subscriptionStatus ?? 'active',
        planCode: companyMeta?.plan?.code ?? 'free',
        planName: companyMeta?.plan?.name ?? 'Free',
        roleId: target.roleId,
        roleName: target.role?.name ?? null,
        permissions,
        isPlatformAdmin: false,
        notificationPrefs: parseNotificationPrefs(
          target.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
        ),
      },
    };
  }

  async getStats() {
    const [companies, users, activeCompanies] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.company.count({ where: { deletedAt: null, isActive: true } }),
    ]);

    return {
      companies,
      activeCompanies,
      suspendedCompanies: companies - activeCompanies,
      users,
    };
  }

  async getMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      signupsLast30Days,
      onboardingPending,
      onboardingComplete,
      trialingCount,
      activePaidCount,
      betaCohortCount,
      feedbackCount,
      activeUsersLast7Days,
      plans,
      allPlans,
      byCohort,
    ] = await Promise.all([
      this.prisma.company.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.company.count({
        where: { deletedAt: null, onboardingCompleted: false },
      }),
      this.prisma.company.count({
        where: { deletedAt: null, onboardingCompleted: true },
      }),
      this.prisma.company.count({
        where: { deletedAt: null, subscriptionStatus: 'trialing' },
      }),
      this.prisma.company.count({
        where: {
          deletedAt: null,
          subscriptionStatus: { in: ['active', 'past_due'] },
          stripeSubscriptionId: { not: null },
        },
      }),
      this.prisma.company.count({
        where: { deletedAt: null, betaCohort: { not: null } },
      }),
      this.prisma.betaFeedback.count(),
      this.prisma.user.count({
        where: { deletedAt: null, isActive: true, lastLoginAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.company.groupBy({
        by: ['planId'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.plan.findMany({ select: { id: true, code: true, name: true } }),
      this.prisma.company.groupBy({
        by: ['betaCohort'],
        where: { deletedAt: null, betaCohort: { not: null } },
        _count: { id: true },
      }),
    ]);

    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const freePlan = allPlans.find((p) => p.code === 'free');
    const byPlanMap = new Map<string, { planCode: string; planName: string; count: number }>();

    for (const row of plans) {
      const plan = row.planId ? planMap.get(row.planId) : freePlan;
      const planCode = plan?.code ?? 'free';
      const planName = plan?.name ?? 'Free';
      const existing = byPlanMap.get(planCode);
      if (existing) {
        existing.count += row._count.id;
      } else {
        byPlanMap.set(planCode, { planCode, planName, count: row._count.id });
      }
    }

    const byPlan = Array.from(byPlanMap.values());
    const registration = await this.beta.getRegistrationConfig();

    return {
      signupsLast30Days,
      onboardingPending,
      onboardingComplete,
      trialingCount,
      activePaidCount,
      betaCohortCount,
      feedbackCount,
      activeUsersLast7Days,
      byPlan,
      byCohort: byCohort.map((row) => ({
        cohort: row.betaCohort ?? 'unknown',
        count: row._count.id,
      })),
      registration,
    };
  }

  async getBillingOverview() {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: { select: { code: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const withStripe = companies.filter((c) => c.stripeSubscriptionId);
    const byStatus = companies.reduce<Record<string, number>>((acc, c) => {
      const s = c.subscriptionStatus ?? 'unknown';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: companies.length,
      withStripeSubscription: withStripe.length,
      byStatus,
      items: companies.map((c) => ({
        id: c.id,
        name: c.name,
        planCode: c.plan?.code ?? 'free',
        planName: c.plan?.name ?? 'Free',
        subscriptionStatus: c.subscriptionStatus,
        hasStripe: !!c.stripeCustomerId,
      })),
    };
  }

  async getSystemStatus() {
    let database: 'connected' | 'error' = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }

    const redis = this.redis.isReady() ? 'connected' : 'unavailable';
    const storage = process.env.STORAGE_DRIVER ?? 'local';
    const stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'disabled';
    const email = process.env.EMAIL_PROVIDER ?? 'console';

    const settings = await this.getSettings();

    return {
      database,
      redis,
      storage,
      stripe,
      email,
      maintenanceMode: settings.maintenanceMode,
    };
  }

  async listFailedWebhooks(limit = 30) {
    return this.prisma.webhookDelivery.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        endpoint: {
          select: {
            id: true,
            url: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async retryWebhook(deliveryId: string) {
    return this.webhooks.retryDelivery(deliveryId);
  }

  async getSettings() {
    const row = await this.prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global' },
    });
    return row;
  }

  async updateMaintenance(
    actorId: string,
    maintenanceMode: boolean,
    maintenanceMessage?: string,
  ) {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: { maintenanceMode, maintenanceMessage: maintenanceMessage ?? null },
      create: { id: 'global', maintenanceMode, maintenanceMessage },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'settings.maintenance',
      targetType: 'platform',
      metadata: { maintenanceMode, maintenanceMessage },
    });

    return settings;
  }

  listAudit(limit?: number) {
    return this.audit.list(limit);
  }

  getRegistrationSettings() {
    return this.beta.getRegistrationConfig();
  }

  updateRegistrationSettings(
    actorId: string,
    dto: { registrationMode?: 'open' | 'invite_only'; betaSignupCap?: number | null },
  ) {
    return this.beta.updateRegistrationSettings(dto).then(async (result) => {
      await this.audit.log({
        actorUserId: actorId,
        action: 'settings.registration',
        targetType: 'platform',
        metadata: dto as Record<string, unknown>,
      });
      return result;
    });
  }

  createBetaInvite(
    actorId: string,
    dto: { email?: string; label?: string; maxUses?: number; expiresAt?: string },
  ) {
    return this.beta.createInvite(actorId, dto).then(async (invite) => {
      await this.audit.log({
        actorUserId: actorId,
        action: 'beta.invite_create',
        targetType: 'beta_invite',
        targetId: invite.id,
        metadata: { email: invite.email, label: invite.label },
      });
      return invite;
    });
  }

  listBetaInvites() {
    return this.beta.listInvites();
  }

  revokeBetaInvite(actorId: string, id: string) {
    return this.beta.revokeInvite(actorId, id).then(async (result) => {
      await this.audit.log({
        actorUserId: actorId,
        action: 'beta.invite_revoke',
        targetType: 'beta_invite',
        targetId: id,
      });
      return result;
    });
  }

  listBetaFeedback(limit?: number) {
    return this.feedback.list(limit);
  }

  listPlans() {
    return this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, name: true },
    });
  }

  private async issueTokens(sub: string, email: string, companyId: string) {
    const payload = { sub, email, companyId };
    const refreshToken = await this.refreshTokens.create(sub, companyId);
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken,
    };
  }
}
