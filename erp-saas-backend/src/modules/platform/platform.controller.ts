import {
  Controller, Get, Patch, Param, Query, Body, UseGuards, Post, Res, Delete,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthCookieService } from '../auth/auth-cookie.service';
import {
  ImpersonateDto,
  UpdateCompanyNotesDto,
  UpdateCompanyPlanDto,
  UpdateCompanyTrialDto,
  UpdateMaintenanceDto,
  UpdatePlatformUserStatusDto,
  CreateBetaInviteDto,
  UpdateRegistrationSettingsDto,
} from './dto/platform.dto';

@ApiTags('Platform Admin')
@ApiBearerAuth()
@SkipThrottle()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platform: PlatformService,
    private readonly authCookies: AuthCookieService,
  ) {}

  @Get('stats')
  getStats() {
    return this.platform.getStats();
  }

  @Get('metrics')
  getMetrics() {
    return this.platform.getMetrics();
  }

  @Get('plans')
  listPlans() {
    return this.platform.listPlans();
  }

  @Get('companies')
  listCompanies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.platform.listCompanies({ page, limit, search });
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.platform.getCompany(id);
  }

  @Patch('companies/:id/status')
  setCompanyStatus(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: { isActive: boolean },
  ) {
    return this.platform.setCompanyActive(actorId, id, dto.isActive);
  }

  @Patch('companies/:id/plan')
  updatePlan(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyPlanDto,
  ) {
    return this.platform.updateCompanyPlan(actorId, id, dto.planCode);
  }

  @Patch('companies/:id/trial')
  updateTrial(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyTrialDto,
  ) {
    return this.platform.updateCompanyTrial(actorId, id, dto.trialEndsAt);
  }

  @Patch('companies/:id/notes')
  updateNotes(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyNotesDto,
  ) {
    return this.platform.updateCompanyNotes(actorId, id, dto.platformNotes);
  }

  @Post('companies/:id/impersonate')
  async impersonate(
    @CurrentUser('id') actorId: string,
    @Param('id') companyId: string,
    @Body() dto: ImpersonateDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.platform.impersonate(actorId, companyId, dto.userId);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>, {
      forceExposeTokens: true,
    });
  }

  @Get('users')
  searchUsers(@Query('search') search: string) {
    return this.platform.searchUsers(search ?? '');
  }

  @Patch('users/:id/status')
  setUserStatus(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlatformUserStatusDto,
  ) {
    return this.platform.setUserActive(actorId, id, dto.isActive);
  }

  @Get('billing')
  getBilling() {
    return this.platform.getBillingOverview();
  }

  @Get('system/status')
  getSystemStatus() {
    return this.platform.getSystemStatus();
  }

  @Get('system/webhooks/failed')
  listFailedWebhooks(@Query('limit') limit?: number) {
    return this.platform.listFailedWebhooks(limit);
  }

  @Post('system/webhooks/:deliveryId/retry')
  retryWebhook(@Param('deliveryId') deliveryId: string) {
    return this.platform.retryWebhook(deliveryId);
  }

  @Get('settings')
  getSettings() {
    return this.platform.getSettings();
  }

  @Patch('settings/maintenance')
  updateMaintenance(
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.platform.updateMaintenance(
      actorId,
      dto.maintenanceMode,
      dto.maintenanceMessage,
    );
  }

  @Get('audit')
  listAudit(@Query('limit') limit?: number) {
    return this.platform.listAudit(limit);
  }

  @Get('beta/registration')
  getRegistrationSettings() {
    return this.platform.getRegistrationSettings();
  }

  @Patch('beta/registration')
  updateRegistrationSettings(
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateRegistrationSettingsDto,
  ) {
    return this.platform.updateRegistrationSettings(actorId, dto);
  }

  @Get('beta/invites')
  listBetaInvites() {
    return this.platform.listBetaInvites();
  }

  @Post('beta/invites')
  createBetaInvite(
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateBetaInviteDto,
  ) {
    return this.platform.createBetaInvite(actorId, dto);
  }

  @Delete('beta/invites/:id')
  revokeBetaInvite(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
  ) {
    return this.platform.revokeBetaInvite(actorId, id);
  }

  @Get('beta/feedback')
  listBetaFeedback(@Query('limit') limit?: number) {
    return this.platform.listBetaFeedback(limit);
  }
}
