import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { MailModule } from '../../common/mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MailModule, AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
