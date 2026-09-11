import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { EmailService } from '../../common/mail/email.service';
import { QueueService } from '../../common/queue/queue.service';
import {
  UpdateCompanyDto, UpdateProfileDto, ChangePasswordDto,
} from './dto/settings.dto';
import { CreateInvitationDto } from './dto/invitation.dto';
import { randomBytes } from 'crypto';
import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPrefs,
} from '../../common/notification-prefs';
import { UpdateNotificationPrefsDto } from './dto/notification-prefs.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { UpdateNavigationPrefsDto } from './dto/navigation-prefs.dto';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import {
  DEFAULT_NAVIGATION_PREFS,
  NavigationPrefs,
  sanitizeNavigationPrefs,
} from '../../common/navigation/menu-registry';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly planLimits: PlanLimitsService,
    private readonly cache: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly queue: QueueService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  getEmailStatus() {
    return this.emailService.getStatus();
  }

  private buildInviteUrl(token: string) {
    const base = this.config.get('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
    return `${base}/accept-invite?token=${token}`;
  }

  getCompany(companyId: string) {
    return this.cache.getOrSet(
      CacheKeys.companySettings(companyId),
      () => this.loadCompany(companyId),
      this.cache.settingsTtlSec,
    );
  }

  private async loadCompany(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: { plan: { select: { code: true, name: true } } },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const raw = company as typeof company & {
      defaultTaxRate?: unknown;
      currency?: string;
      orderPrefix?: string;
      invoicePrefix?: string;
      creditNotePrefix?: string;
      quotePrefix?: string;
      poPrefix?: string;
      monthlySalesTarget?: unknown;
      taxId?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      postalCode?: string | null;
      country?: string | null;
    };

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      taxId: raw.taxId ?? null,
      email: raw.email ?? null,
      phone: raw.phone ?? null,
      address: raw.address ?? null,
      city: raw.city ?? null,
      postalCode: raw.postalCode ?? null,
      country: raw.country ?? 'ES',
      defaultTaxRate: Number(raw.defaultTaxRate ?? 21),
      currency: raw.currency ?? 'EUR',
      orderPrefix: raw.orderPrefix ?? 'PED',
      invoicePrefix: raw.invoicePrefix ?? 'FAC',
      creditNotePrefix: raw.creditNotePrefix ?? 'REC',
      quotePrefix: raw.quotePrefix ?? 'PRE',
      poPrefix: raw.poPrefix ?? 'OC',
      monthlySalesTarget: raw.monthlySalesTarget != null ? Number(raw.monthlySalesTarget) : null,
      onboardingCompleted: raw.onboardingCompleted,
      subscriptionStatus: raw.subscriptionStatus ?? 'active',
      trialEndsAt: raw.trialEndsAt ?? null,
      planCode: raw.plan?.code ?? 'free',
      planName: raw.plan?.name ?? 'Free',
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    await this.loadCompany(companyId);
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
    this.cacheInvalidation.onSettingsChanged(companyId);
    this.cacheInvalidation.onBusinessDataChanged(companyId);
    return {
      ...company,
      defaultTaxRate: Number(company.defaultTaxRate),
      monthlySalesTarget: company.monthlySalesTarget != null
        ? Number(company.monthlySalesTarget)
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId }, deletedAt: null },
      });
      if (exists) throw new ConflictException('El email ya está en uso');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
      },
      include: { company: { select: { name: true } } },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      companyName: user.company.name,
      emailVerified: user.emailVerified,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');

    const password = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password },
    });

    await this.refreshTokens.revokeAllForUser(userId);
    this.cacheInvalidation.onUserRoleChanged(userId);

    return { message: 'Contraseña actualizada' };
  }

  async listUsers(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { email: 'asc' },
    });
    return users;
  }

  async assignUserRole(companyId: string, userId: string, roleId: string | null | undefined) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: roleId, companyId, deletedAt: null },
      });
      if (!role) throw new NotFoundException('Rol no encontrado');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: roleId ?? null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    }).then((user) => {
      this.cacheInvalidation.onUserRoleChanged(userId);
      return user;
    });
  }

  async listInvitations(companyId: string) {
    return this.prisma.userInvitation.findMany({
      where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOnboardingStatus(companyId: string) {
    const company = await this.getCompany(companyId);
    return {
      onboardingCompleted: company.onboardingCompleted,
      companyName: company.name,
    };
  }

  async completeOnboarding(companyId: string, dto: CompleteOnboardingDto) {
    await this.loadCompany(companyId);
    const completed = dto.completed !== false;
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { onboardingCompleted: completed },
      include: { plan: { select: { code: true, name: true } } },
    });
    this.cacheInvalidation.onSettingsChanged(companyId);
    return {
      onboardingCompleted: company.onboardingCompleted,
      planCode: company.plan?.code ?? 'free',
    };
  }

  async createInvitation(companyId: string, invitedBy: string, dto: CreateInvitationDto) {
    await this.planLimits.assertCanAddUser(companyId);

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUser) {
      if (existingUser.companyId === companyId) {
        throw new ConflictException('Este email ya pertenece a un usuario de tu empresa');
      }
      throw new ConflictException('Este email ya está registrado en otra empresa');
    }

    let roleId = dto.roleId ?? null;
    if (roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: roleId, companyId, deletedAt: null },
      });
      if (!role) throw new NotFoundException('Rol no encontrado');
    } else {
      const employeeRole = await this.prisma.role.findFirst({
        where: { companyId, name: 'empleado', deletedAt: null },
        select: { id: true },
      });
      roleId = employeeRole?.id ?? null;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { name: true },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const inv = await this.prisma.userInvitation.upsert({
      where: { companyId_email: { companyId, email } },
      update: { token, expiresAt, roleId, invitedBy, acceptedAt: null },
      create: {
        email,
        companyId,
        roleId,
        token,
        expiresAt,
        invitedBy,
      },
      include: { role: { select: { id: true, name: true } } },
    });

    const inviteUrl = this.buildInviteUrl(inv.token);
    this.queue.enqueueInvitationEmail({
      to: email,
      inviteUrl,
      companyName: company.name,
    });

    return {
      ...inv,
      inviteUrl: `/accept-invite?token=${inv.token}`,
      fullInviteUrl: inviteUrl,
      emailQueued: true,
    };
  }

  async cancelInvitation(companyId: string, id: string) {
    const inv = await this.prisma.userInvitation.findFirst({
      where: { id, companyId, acceptedAt: null },
    });
    if (!inv) throw new NotFoundException('Invitación no encontrada');
    await this.prisma.userInvitation.delete({ where: { id } });
    return { message: 'Invitación cancelada' };
  }

  getFormLayout(companyId: string, entityId: string) {
    return this.cache.getOrSet(
      CacheKeys.formLayout(companyId, entityId),
      () => this.loadFormLayout(companyId, entityId),
      this.cache.settingsTtlSec,
    );
  }

  private async loadFormLayout(companyId: string, entityId: string) {
    const saved = await this.prisma.formLayout.findUnique({
      where: { companyId_entityId: { companyId, entityId } },
    });
    if (saved) {
      return { entityId, config: saved.config, isDefault: false };
    }
    return { entityId, config: null, isDefault: true };
  }

  async updateFormLayout(companyId: string, entityId: string, config: object) {
    const layout = await this.prisma.formLayout.upsert({
      where: { companyId_entityId: { companyId, entityId } },
      update: { config },
      create: { companyId, entityId, config },
    });
    this.cacheInvalidation.onSettingsChanged(companyId, entityId);
    return { entityId, config: layout.config, isDefault: false };
  }

  async resetFormLayout(companyId: string, entityId: string) {
    await this.prisma.formLayout.deleteMany({ where: { companyId, entityId } });
    this.cacheInvalidation.onSettingsChanged(companyId, entityId);
    return { message: 'Diseño restablecido' };
  }

  async getNotificationPrefs(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { notificationPrefs: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return parseNotificationPrefs(user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS);
  }

  async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto) {
    const current = await this.getNotificationPrefs(userId);
    const next = {
      notifyOrders: dto.notifyOrders ?? current.notifyOrders,
      notifyInvoices: dto.notifyInvoices ?? current.notifyInvoices,
      notifySystem: dto.notifySystem ?? current.notifySystem,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: next },
    });

    return next;
  }

  getNavigationPrefs(companyId: string) {
    return this.cache.getOrSet(
      CacheKeys.navigationPrefs(companyId),
      () => this.loadNavigationPrefs(companyId),
      this.cache.settingsTtlSec,
    );
  }

  private async loadNavigationPrefs(companyId: string) {
    const company = await this.getCompanyWithPlan(companyId);
    const resolved = this.planLimits.resolvePlan(company);
    const raw = (company as { navigationPrefs?: NavigationPrefs | null }).navigationPrefs;
    const prefs = sanitizeNavigationPrefs(raw ?? DEFAULT_NAVIGATION_PREFS, resolved.features);
    return {
      prefs,
      plan: {
        code: resolved.code,
        name: resolved.trial ? `${resolved.name} (trial)` : resolved.name,
        features: resolved.features,
        trial: resolved.trial,
      },
    };
  }

  async updateNavigationPrefs(companyId: string, dto: UpdateNavigationPrefsDto) {
    const company = await this.getCompanyWithPlan(companyId);
    const resolved = this.planLimits.resolvePlan(company);
    const prefs = sanitizeNavigationPrefs(dto as NavigationPrefs, resolved.features);

    await this.prisma.company.update({
      where: { id: companyId },
      data: { navigationPrefs: prefs as object },
    });

    this.cacheInvalidation.onSettingsChanged(companyId);

    return {
      prefs,
      plan: {
        code: resolved.code,
        name: resolved.trial ? `${resolved.name} (trial)` : resolved.name,
        features: resolved.features,
        trial: resolved.trial,
      },
    };
  }

  private async getCompanyWithPlan(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: { plan: true },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }
}
