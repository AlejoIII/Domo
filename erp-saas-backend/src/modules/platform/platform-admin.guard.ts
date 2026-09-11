import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get('PLATFORM_ADMIN_ENABLED') !== 'true') {
      throw new ForbiddenException('Panel de plataforma deshabilitado');
    }

    const user = context.switchToHttp().getRequest().user as {
      isPlatformAdmin?: boolean;
    } | undefined;

    if (!user?.isPlatformAdmin) {
      throw new ForbiddenException('Acceso reservado a administradores de plataforma');
    }

    return true;
  }
}
