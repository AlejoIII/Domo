import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  UpdateCompanyDto, UpdateProfileDto, ChangePasswordDto,
} from './dto/settings.dto';
import { AssignRoleDto } from '../roles/dto/role.dto';
import { CreateInvitationDto } from './dto/invitation.dto';
import { UpdateFormLayoutDto } from './dto/form-layout.dto';
import { UpdateNotificationPrefsDto } from './dto/notification-prefs.dto';
import { UpdateNavigationPrefsDto } from './dto/navigation-prefs.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  getCompany(@CurrentUser('companyId') companyId: string) {
    return this.settingsService.getCompany(companyId);
  }

  @Patch('company')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  updateCompany(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.settingsService.updateCompany(companyId, dto);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(userId, dto);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(userId, dto);
  }

  @Get('users')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  listUsers(@CurrentUser('companyId') companyId: string) {
    return this.settingsService.listUsers(companyId);
  }

  @Patch('users/:userId/role')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  assignUserRole(
    @CurrentUser('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.settingsService.assignUserRole(companyId, userId, dto.roleId);
  }

  @Get('email-status')
  @RequireAdmin()
  @RequirePermissions('settings.read')
  getEmailStatus() {
    return this.settingsService.getEmailStatus();
  }

  @Get('invitations')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  listInvitations(@CurrentUser('companyId') companyId: string) {
    return this.settingsService.listInvitations(companyId);
  }

  @Post('invitations')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  createInvitation(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.settingsService.createInvitation(companyId, userId, dto);
  }

  @Delete('invitations/:id')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  cancelInvitation(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.settingsService.cancelInvitation(companyId, id);
  }

  @Get('form-layouts/:entityId')
  getFormLayout(
    @CurrentUser('companyId') companyId: string,
    @Param('entityId') entityId: string,
  ) {
    return this.settingsService.getFormLayout(companyId, entityId);
  }

  @Patch('form-layouts/:entityId')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  updateFormLayout(
    @CurrentUser('companyId') companyId: string,
    @Param('entityId') entityId: string,
    @Body() dto: UpdateFormLayoutDto,
  ) {
    return this.settingsService.updateFormLayout(companyId, entityId, dto.config);
  }

  @Delete('form-layouts/:entityId')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  resetFormLayout(
    @CurrentUser('companyId') companyId: string,
    @Param('entityId') entityId: string,
  ) {
    return this.settingsService.resetFormLayout(companyId, entityId);
  }

  @Get('notifications')
  getNotificationPrefs(@CurrentUser('id') userId: string) {
    return this.settingsService.getNotificationPrefs(userId);
  }

  @Patch('notifications')
  updateNotificationPrefs(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.settingsService.updateNotificationPrefs(userId, dto);
  }

  @Get('onboarding')
  getOnboardingStatus(@CurrentUser('companyId') companyId: string) {
    return this.settingsService.getOnboardingStatus(companyId);
  }

  @Patch('onboarding')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  completeOnboarding(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.settingsService.completeOnboarding(companyId, dto);
  }

  @Get('navigation')
  @RequirePermissions('settings.read')
  getNavigationPrefs(@CurrentUser('companyId') companyId: string) {
    return this.settingsService.getNavigationPrefs(companyId);
  }

  @Patch('navigation')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  updateNavigationPrefs(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateNavigationPrefsDto,
  ) {
    return this.settingsService.updateNavigationPrefs(companyId, dto);
  }
}
