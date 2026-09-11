import {
  Controller, Get, Post, Patch, Body, UseGuards, Headers, Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SwitchDemoPlanDto } from './dto/switch-demo-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';

@ApiTags('Billing')
@SkipThrottle()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('webhook')
  handleWebhook(    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody, signature);
  }

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.read')
  getStatus(@CurrentUser('companyId') companyId: string) {
    return this.billingService.getStatus(companyId);
  }

  @Get('usage')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.read')
  getUsage(@CurrentUser('companyId') companyId: string) {
    return this.billingService.getUsage(companyId);
  }

  @Get('print-branding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getPrintBranding(@CurrentUser('companyId') companyId: string) {
    return this.billingService.getPrintBranding(companyId);
  }

  @Get('plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.read')
  listPlans() {
    return this.billingService.listPlans();
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.billing')
  createCheckout(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billingService.createCheckout(companyId, dto.planCode, email);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.billing')
  createPortal(@CurrentUser('companyId') companyId: string) {
    return this.billingService.createPortal(companyId);
  }

  @Post('sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.billing')
  syncSubscription(@CurrentUser('companyId') companyId: string) {
    return this.billingService.syncSubscription(companyId);
  }

  @Patch('demo-plan')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAdmin()
  @RequirePermissions('settings.billing')
  switchDemoPlan(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: SwitchDemoPlanDto,
  ) {
    return this.billingService.switchDemoPlan(companyId, dto.planCode);
  }
}
