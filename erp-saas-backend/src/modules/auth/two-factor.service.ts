import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { PrismaService } from '../../common/database/prisma.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepo: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  private get issuer(): string {
    return this.config.get('TOTP_ISSUER', 'Domo');
  }

  isAdminUser(user: {
    isPlatformAdmin?: boolean;
    role?: { name: string } | null;
  }): boolean {
    if (user.isPlatformAdmin) return true;
    return user.role?.name?.toLowerCase() === 'admin';
  }

  async assertAdminUser(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (!this.isAdminUser(user)) {
      throw new ForbiddenException('2FA solo está disponible para administradores');
    }
    return user;
  }

  verifyCode(secret: string, code: string): boolean {
    const normalized = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;
    return verifySync({ secret, token: normalized }).valid;
  }

  async setup(userId: string) {
    const user = await this.assertAdminUser(userId);
    if (user.totpEnabled) {
      throw new ForbiddenException('2FA ya está activado. Desactívalo antes de reconfigurarlo.');
    }

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });

    return {
      secret,
      otpauthUrl: generateURI({
        issuer: this.issuer,
        label: user.email,
        secret,
      }),
    };
  }

  async enable(userId: string, code: string) {
    const user = await this.assertAdminUser(userId);
    if (!user.totpSecret) {
      throw new ForbiddenException('Primero debes iniciar la configuración de 2FA');
    }
    if (user.totpEnabled) {
      return { enabled: true, message: '2FA ya estaba activado' };
    }
    if (!this.verifyCode(user.totpSecret, code)) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return { enabled: true, message: '2FA activado correctamente' };
  }

  async disable(userId: string, code: string) {
    const user = await this.assertAdminUser(userId);
    if (!user.totpEnabled || !user.totpSecret) {
      return { enabled: false, message: '2FA no estaba activado' };
    }
    if (!this.verifyCode(user.totpSecret, code)) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });

    return { enabled: false, message: '2FA desactivado correctamente' };
  }

  async getStatus(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException();

    return {
      enabled: user.totpEnabled,
      canSetup: this.isAdminUser(user),
    };
  }

  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: { totpEnabled: true, totpSecret: true },
    });
    if (!user?.totpEnabled || !user.totpSecret) return false;
    return this.verifyCode(user.totpSecret, code);
  }
}
