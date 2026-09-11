import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../common/mail/email.service';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AcceptInviteDto } from '../settings/dto/invitation.dto';
import { BetaService } from '../beta/beta.service';
import { slugify } from '../../shared/utils/slugify';
import { generateVerificationCode } from '../../shared/utils/verification-code';
import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPrefs,
} from '../../common/notification-prefs';
import type { User } from '@prisma/client';

import { PlanLimitsService } from '../billing/plan-limits.service';
import { RefreshTokenService } from './refresh-token.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { AccountLockoutService } from './account-lockout.service';
import { TwoFactorService } from './two-factor.service';
import { VerifyTotpLoginDto } from './dto/two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';
import {
  CATALOG_PERMISSIONS,
  EMPLOYEE_DEFAULT_PERMISSIONS,
} from '../roles/role-permissions.catalog';

const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly planLimits: PlanLimitsService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly accountLockout: AccountLockoutService,
    private readonly twoFactor: TwoFactorService,
    private readonly beta: BetaService,
  ) {}

  private isEmailVerificationEnabled() {
    return this.config.get('EMAIL_VERIFICATION_ENABLED') === 'true';
  }

  private isDev() {
    return this.config.get('NODE_ENV') !== 'production';
  }

  private async assertNotInMaintenance(isPlatformAdmin = false) {
    if (isPlatformAdmin) return;
    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });
    if (settings?.maintenanceMode) {
      throw new ForbiddenException(
        settings.maintenanceMessage
          ?? 'Domo está en mantenimiento. Inténtalo más tarde.',
      );
    }
  }

  async getRegistrationConfig() {
    return this.beta.getRegistrationConfig();
  }

  async validateBetaInvite(token: string, email?: string) {
    const invite = await this.beta.validateInviteToken(token, email);
    return {
      valid: true,
      label: invite.label,
      emailLocked: !!invite.email,
      email: invite.email,
    };
  }

  async register(dto: RegisterDto) {
    await this.assertNotInMaintenance(false);
    if (!dto.acceptedTerms) {
      throw new BadRequestException('Debes aceptar los términos y la política de privacidad');
    }
    await this.beta.assertRegistrationAllowed(dto.inviteToken);

    const config = await this.beta.getRegistrationConfig();
    let validatedInvite: { id: string; label: string } | null = null;
    if (config.requiresInvite || dto.inviteToken) {
      validatedInvite = await this.beta.validateInviteToken(dto.inviteToken ?? '', dto.email);
    }

    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const baseSlug = slugify(dto.companyName);
    const verificationEnabled = this.isEmailVerificationEnabled();
    const verificationToken = verificationEnabled ? generateVerificationCode() : null;
    const verificationTokenExpires = verificationEnabled
      ? new Date(Date.now() + VERIFICATION_TTL_MS)
      : null;

    const { user, company } = await this.prisma.$transaction(async (tx) => {
      let slug = baseSlug;
      let suffix = 0;
      while (await tx.company.findFirst({ where: { slug, deletedAt: null } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const freePlan = await tx.plan.findUnique({ where: { code: 'free' } });
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          slug,
          planId: freePlan?.id ?? null,
          trialEndsAt,
          subscriptionStatus: 'trialing',
          onboardingCompleted: false,
          betaCohort: validatedInvite?.label ?? null,
        },
      });

      const permissions = await Promise.all(
        CATALOG_PERMISSIONS.map((name) =>
          tx.permission.upsert({
            where: { name },
            update: {},
            create: { name, description: name },
          }),
        ),
      );
      const permissionByName = new Map(permissions.map((p) => [p.name, p.id]));

      const adminRole = await tx.role.create({
        data: {
          name: 'admin',
          description: 'Administrador — acceso completo a la empresa',
          companyId: company.id,
        },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
        });
      }

      // Rol base para invitaciones / empleados (sin admin, API, facturación SaaS, etc.)
      const employeeRole = await tx.role.create({
        data: {
          name: 'empleado',
          description: 'Empleado — acceso operativo estándar',
          companyId: company.id,
        },
      });
      const employeePermissionIds = EMPLOYEE_DEFAULT_PERMISSIONS
        .map((name) => permissionByName.get(name))
        .filter((id): id is string => Boolean(id));
      if (employeePermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: employeePermissionIds.map((permissionId) => ({
            roleId: employeeRole.id,
            permissionId,
          })),
        });
      }

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          companyId: company.id,
          roleId: adminRole.id,
          emailVerified: !verificationEnabled,
          verificationToken,
          verificationTokenExpires,
        },
      });

      if (validatedInvite) {
        await this.beta.consumeInvite(tx, validatedInvite.id, company.id);
      }

      return { user, company };
    });

    if (verificationEnabled && verificationToken) {
      const emailResult = await this.emailService.sendVerificationCode(
        user.email,
        verificationToken,
      );

      return {
        message: emailResult.sent
          ? 'Cuenta creada. Revisa tu email para verificarla.'
          : 'Cuenta creada. No se pudo enviar el email de verificación.',
        email: user.email,
        emailSent: emailResult.sent,
        emailError: emailResult.error,
        emailProvider: emailResult.provider,
        requiresVerification: true,
        ...(this.isDev() ? { devCode: verificationToken } : {}),
      };
    }

    const tokens = await this.issueTokens(user.id, user.email, user.companyId);
    const full = await this.usersRepo.findById(user.id);
    const companyMeta = await this.getCompanyMeta(user.companyId);
    return {
      user: this.toPublicUser(full!, companyMeta?.name, companyMeta),
      message: 'Cuenta creada correctamente',
      requiresVerification: false,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    await this.accountLockout.assertNotLocked(dto.email);

    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      await this.accountLockout.recordFailedAttempt(dto.email);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (this.isEmailVerificationEnabled() && !user.emailVerified) {
      throw new ForbiddenException('Debes verificar tu email antes de iniciar sesión');
    }

    await this.assertNotInMaintenance(user.isPlatformAdmin);

    const company = await this.prisma.company.findFirst({
      where: { id: user.companyId, deletedAt: null },
      select: { isActive: true },
    });
    if (!company?.isActive && !user.isPlatformAdmin) {
      throw new ForbiddenException('Tu empresa ha sido suspendida. Contacta con soporte.');
    }

    await this.accountLockout.clearFailedAttempts(dto.email);

    if (user.totpEnabled) {
      return {
        requiresTotp: true,
        tempToken: this.createTotpTempToken(user.id),
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.companyId);
    const full = await this.usersRepo.findById(user.id);
    const companyMeta = await this.getCompanyMeta(user.companyId);
    return {
      user: this.toPublicUser(full!, companyMeta?.name, companyMeta),
      ...tokens,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        verificationToken: dto.code,
        deletedAt: null,
        verificationTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    const full = await this.usersRepo.findById(updated.id);
    const tokens = await this.issueTokens(updated.id, updated.email, updated.companyId);
    const companyMeta = await this.getCompanyMeta(updated.companyId);

    return {
      message: 'Email verificado correctamente',
      user: this.toPublicUser(full!, companyMeta?.name, companyMeta),
      ...tokens,
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user || user.emailVerified) {
      return { message: 'Si el email existe, recibirás un código de verificación' };
    }

    const verificationToken = generateVerificationCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });

    const emailResult = await this.emailService.sendVerificationCode(user.email, verificationToken);
    return {
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      emailProvider: emailResult.provider,
      message: emailResult.sent
        ? 'Código reenviado. Revisa tu bandeja.'
        : emailResult.error ?? 'No se pudo enviar el email',
      ...(this.isDev() ? { devCode: verificationToken } : {}),
    };
  }

  async verifyTotpLogin(dto: VerifyTotpLoginDto) {
    const userId = this.verifyTotpTempToken(dto.tempToken);
    const valid = await this.twoFactor.verifyLoginCode(userId, dto.code);
    if (!valid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException();

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.companyId);
    const companyMeta = await this.getCompanyMeta(user.companyId);
    return {
      user: this.toPublicUser(user, companyMeta?.name, companyMeta),
      ...tokens,
    };
  }

  setupTwoFactor(userId: string) {
    return this.twoFactor.setup(userId);
  }

  enableTwoFactor(userId: string, code: string) {
    return this.twoFactor.enable(userId, code);
  }

  disableTwoFactor(userId: string, code: string) {
    return this.twoFactor.disable(userId, code);
  }

  getTwoFactorStatus(userId: string) {
    return this.twoFactor.getStatus(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericMessage =
      'Si el email existe, recibirás un enlace para restablecer tu contraseña';

    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user || !user.isActive) {
      return { message: genericMessage };
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const resetUrl = this.buildPasswordResetUrl(token);
    const emailResult = await this.emailService.sendPasswordResetLink(user.email, resetUrl);

    return {
      message: genericMessage,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      emailProvider: emailResult.provider,
      ...(this.isDev() ? { devResetUrl: resetUrl } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        deletedAt: null,
        isActive: true,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const password = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await this.refreshTokens.revokeAllForUser(user.id);
    await this.accountLockout.clearFailedAttempts(user.email);
    this.cacheInvalidation.onUserRoleChanged(user.id);

    return { message: 'Contraseña restablecida correctamente' };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const rotated = await this.refreshTokens.rotate(refreshToken);
    const accessToken = this.jwtService.sign({
      sub: rotated.userId,
      email: rotated.email,
      companyId: rotated.companyId,
    });
    return {
      accessToken,
      refreshToken: rotated.newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokens.revoke(refreshToken, userId);
    }
    this.cacheInvalidation.onUserRoleChanged(userId);
    return { message: 'Logged out' };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException();
    const company = await this.prisma.company.findFirst({
      where: { id: user.companyId },
      select: {
        name: true,
        onboardingCompleted: true,
        subscriptionStatus: true,
        plan: { select: { code: true, name: true } },
      },
    });
    return this.toPublicUser(user, company?.name, company);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invitation = await this.prisma.userInvitation.findFirst({
      where: {
        token: dto.token,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { company: { select: { name: true } } },
    });
    if (!invitation) throw new BadRequestException('Invitación inválida o expirada');

    await this.planLimits.assertCanAddUser(invitation.companyId);

    const existing = await this.usersRepo.findByEmail(invitation.email);
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invitation.email,
          password: passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          companyId: invitation.companyId,
          roleId: invitation.roleId,
          emailVerified: true,
          isActive: true,
        },
      });
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    const full = await this.usersRepo.findById(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.companyId);
    const companyMeta = await this.getCompanyMeta(user.companyId);
    return {
      user: this.toPublicUser(full!, invitation.company.name, companyMeta),
      ...tokens,
      message: 'Cuenta activada correctamente',
    };
  }

  private async getCompanyMeta(companyId: string) {
    return this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: {
        name: true,
        onboardingCompleted: true,
        subscriptionStatus: true,
        plan: { select: { code: true, name: true } },
      },
    });
  }

  private toPublicUser(
    user: User & {
      role?: {
        name: string;
        permissions: { permission: { name: string } }[];
      } | null;
    },
    companyName?: string,
    companyMeta?: {
      onboardingCompleted?: boolean;
      subscriptionStatus?: string;
      plan?: { code: string; name: string } | null;
    } | null,
  ) {
    const permissions =
      user.role?.permissions.map((rp) => rp.permission.name) ?? [];
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      emailVerified: user.emailVerified,
      roleId: user.roleId,
      roleName: user.role?.name ?? null,
      permissions,
      isPlatformAdmin: user.isPlatformAdmin ?? false,
      totpEnabled: user.totpEnabled ?? false,
      notificationPrefs: parseNotificationPrefs(
        user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
      ),
      ...(companyName ? { companyName } : {}),
      ...(companyMeta
        ? {
            onboardingCompleted: companyMeta.onboardingCompleted ?? false,
            subscriptionStatus: companyMeta.subscriptionStatus ?? 'active',
            planCode: companyMeta.plan?.code ?? 'free',
            planName: companyMeta.plan?.name ?? 'Free',
          }
        : {}),
    };
  }

  private buildPasswordResetUrl(token: string) {
    const base = this.config.get('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
    return `${base}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private createTotpTempToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, purpose: 'totp' },
      { expiresIn: '5m' },
    );
  }

  private verifyTotpTempToken(token: string): string {
    try {
      const payload = this.jwtService.verify<{ sub: string; purpose?: string }>(token);
      if (payload.purpose !== 'totp' || !payload.sub) {
        throw new UnauthorizedException('Token de verificación inválido');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token de verificación inválido o expirado');
    }
  }

  private async issueTokens(sub: string, email: string, companyId: string) {
    const payload = { sub, email, companyId };
    const refreshToken = await this.refreshTokens.create(sub, companyId);
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
    };
  }
}
