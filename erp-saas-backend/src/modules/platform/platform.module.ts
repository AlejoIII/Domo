import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformAuditService } from './platform-audit.service';
import { AuthModule } from '../auth/auth.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    AuthModule,
    FeedbackModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me'),
        signOptions: { expiresIn: '15m' as const },
      }),
    }),
  ],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformAdminGuard, PlatformAuditService],
})
export class PlatformModule {}
