import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SESSION_REFRESH_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private getRefreshTtlMs(rememberMe = true): number {
    if (!rememberMe) {
      const sessionDays = Number(this.config.get('JWT_REFRESH_SESSION_DAYS', '1'));
      if (!Number.isFinite(sessionDays) || sessionDays <= 0) return DEFAULT_SESSION_REFRESH_TTL_MS;
      return sessionDays * 24 * 60 * 60 * 1000;
    }
    const days = Number(this.config.get('JWT_REFRESH_EXPIRES_DAYS', '7'));
    if (!Number.isFinite(days) || days <= 0) return DEFAULT_REFRESH_TTL_MS;
    return days * 24 * 60 * 60 * 1000;
  }

  async create(userId: string, companyId: string, rememberMe = true): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const token = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + this.getRefreshTtlMs(rememberMe));

    await this.prisma.refreshToken.create({
      data: { token, userId, companyId, expiresAt },
    });

    return raw;
  }

  async rotate(rawToken: string): Promise<{
    userId: string;
    email: string;
    companyId: string;
    newRefreshToken: string;
    rememberMe: boolean;
  }> {
    const hash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: hash },
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.revokedAt) {
      await this.revokeAllForUser(record.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!record.user.isActive || record.user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const rememberMe = record.expiresAt.getTime() - record.createdAt.getTime() > 36 * 60 * 60 * 1000;
    const newRefreshToken = await this.create(record.userId, record.companyId, rememberMe);

    return {
      userId: record.userId,
      email: record.user.email,
      companyId: record.companyId,
      newRefreshToken,
      rememberMe,
    };
  }

  async revoke(rawToken: string, userId?: string): Promise<void> {
    const hash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: hash },
    });

    if (!record || record.revokedAt) return;
    if (userId && record.userId !== userId) return;

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
