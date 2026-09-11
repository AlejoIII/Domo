import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';

export type RegistrationMode = 'open' | 'invite_only';

export interface RegistrationConfig {
  mode: RegistrationMode;
  requiresInvite: boolean;
  betaSignupCap: number | null;
  betaSignupCount: number;
  signupCapReached: boolean;
}

export interface ValidatedBetaInvite {
  id: string;
  label: string;
  email: string | null;
}

@Injectable()
export class BetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async getPlatformSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global' },
    });
  }

  resolveRegistrationMode(settingsMode: string): RegistrationMode {
    const envMode = this.config.get<string>('REGISTRATION_MODE', 'open');
    const mode = settingsMode || envMode;
    return mode === 'invite_only' ? 'invite_only' : 'open';
  }

  resolveBetaSignupCap(settingsCap: number | null | undefined): number | null {
    if (settingsCap != null) return settingsCap;
    const envCap = this.config.get<string>('BETA_SIGNUP_CAP', '');
    if (!envCap) return null;
    const parsed = Number.parseInt(envCap, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  async getRegistrationConfig(): Promise<RegistrationConfig> {
    const settings = await this.getPlatformSettings();
    const mode = this.resolveRegistrationMode(settings.registrationMode);
    const betaSignupCap = this.resolveBetaSignupCap(settings.betaSignupCap);
    const betaSignupCount = await this.prisma.company.count({
      where: { deletedAt: null, betaCohort: { not: null } },
    });

    return {
      mode,
      requiresInvite: mode === 'invite_only',
      betaSignupCap,
      betaSignupCount,
      signupCapReached: betaSignupCap != null && betaSignupCount >= betaSignupCap,
    };
  }

  async validateInviteToken(token: string, email?: string): Promise<ValidatedBetaInvite> {
    const invite = await this.prisma.betaInvite.findUnique({ where: { token } });
    if (!invite || invite.revokedAt) {
      throw new BadRequestException('Invitación beta no válida');
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('La invitación beta ha expirado');
    }
    if (invite.usedCount >= invite.maxUses) {
      throw new BadRequestException('La invitación beta ya ha sido utilizada');
    }
    if (invite.email && email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException('Esta invitación está reservada para otro email');
    }

    return {
      id: invite.id,
      label: invite.label,
      email: invite.email,
    };
  }

  async assertRegistrationAllowed(inviteToken?: string) {
    const config = await this.getRegistrationConfig();

    if (config.signupCapReached) {
      throw new ForbiddenException(
        'La beta cerrada ha alcanzado el cupo de empresas. Contacta con soporte.',
      );
    }

    if (config.requiresInvite) {
      if (!inviteToken?.trim()) {
        throw new ForbiddenException(
          'El registro está restringido. Necesitas un enlace de invitación beta.',
        );
      }
    }
  }

  async consumeInvite(
    tx: Prisma.TransactionClient,
    inviteId: string,
    companyId: string,
  ) {
    const invite = await tx.betaInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.revokedAt) {
      throw new BadRequestException('Invitación beta no válida');
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('La invitación beta ha expirado');
    }
    if (invite.usedCount >= invite.maxUses) {
      throw new BadRequestException('La invitación beta ya ha sido utilizada');
    }

    await tx.betaInvite.update({
      where: { id: inviteId },
      data: {
        usedCount: { increment: 1 },
        companyId,
      },
    });

    return invite.label;
  }

  generateInviteToken() {
    return randomBytes(24).toString('base64url');
  }

  buildRegisterUrl(token: string) {
    const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    return `${base.replace(/\/$/, '')}/register?invite=${token}`;
  }

  async createInvite(
    actorId: string,
    dto: {
      email?: string;
      label?: string;
      maxUses?: number;
      expiresAt?: string;
    },
  ) {
    const token = this.generateInviteToken();
    const invite = await this.prisma.betaInvite.create({
      data: {
        token,
        email: dto.email?.trim().toLowerCase() || null,
        label: dto.label?.trim() || 'beta-2026',
        maxUses: dto.maxUses ?? 1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: actorId,
      },
    });

    return {
      ...invite,
      registerUrl: this.buildRegisterUrl(token),
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
    };
  }

  async listInvites() {
    const rows = await this.prisma.betaInvite.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      token: row.token,
      email: row.email,
      label: row.label,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      company: row.company,
      registerUrl: this.buildRegisterUrl(row.token),
      isActive: !row.revokedAt
        && (!row.expiresAt || row.expiresAt >= new Date())
        && row.usedCount < row.maxUses,
    }));
  }

  async revokeInvite(actorId: string, id: string) {
    const invite = await this.prisma.betaInvite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('Invitación no encontrada');

    await this.prisma.betaInvite.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return { id, revoked: true, actorId };
  }

  async updateRegistrationSettings(
    dto: { registrationMode?: RegistrationMode; betaSignupCap?: number | null },
  ) {
    const data: { registrationMode?: string; betaSignupCap?: number | null } = {};
    if (dto.registrationMode) data.registrationMode = dto.registrationMode;
    if (dto.betaSignupCap !== undefined) data.betaSignupCap = dto.betaSignupCap;

    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });

    const config = await this.getRegistrationConfig();
    // Same shape as getRegistrationConfig so clients can setQueryData without remapping.
    return {
      ...config,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
