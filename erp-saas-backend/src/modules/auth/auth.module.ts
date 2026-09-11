import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from '../../common/mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../../common/cache/cache.module';
import { RefreshTokenService } from './refresh-token.service';
import { AccountLockoutService } from './account-lockout.service';
import { TwoFactorService } from './two-factor.service';
import { AuthCookieService } from './auth-cookie.service';

@Module({
  imports: [
    UsersModule,
    MailModule,
    CacheModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me'),
        signOptions: { expiresIn: '15m' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenService, AccountLockoutService, TwoFactorService, AuthCookieService],
  exports: [AuthService, RefreshTokenService, AuthCookieService],
})
export class AuthModule {}
