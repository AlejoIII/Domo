import { Controller, Post, Body, UseGuards, Get, Req, Res, UnauthorizedException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AcceptInviteDto } from '../settings/dto/invitation.dto';
import { LogoutDto } from './dto/logout.dto';
import { TotpCodeDto, VerifyTotpLoginDto } from './dto/two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthCookieService, REFRESH_TOKEN_COOKIE } from './auth-cookie.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookies: AuthCookieService,
  ) {}

  @SkipThrottle()
  @Get('registration-config')
  getRegistrationConfig() {
    return this.authService.getRegistrationConfig();
  }

  @SkipThrottle()
  @Get('validate-invite')
  validateInvite(@Query('token') token: string, @Query('email') email?: string) {
    return this.authService.validateBetaInvite(token, email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(dto);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('accept-invite')
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvite(dto);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('2fa/verify-login')
  async verifyTotpLogin(
    @Body() dto: VerifyTotpLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyTotpLogin(dto);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  twoFactorStatus(@CurrentUser('id') userId: string) {
    return this.authService.getTwoFactorStatus(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser('id') userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  enableTwoFactor(@CurrentUser('id') userId: string, @Body() dto: TotpCodeDto) {
    return this.authService.enableTwoFactor(userId, dto.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  disableTwoFactor(@CurrentUser('id') userId: string, @Body() dto: TotpCodeDto) {
    return this.authService.disableTwoFactor(userId, dto.code);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto.refreshToken ?? req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const result = await this.authService.refresh(refreshToken);
    return this.authCookies.wrapAuthResponse(res, result as Record<string, unknown>);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto.refreshToken ?? req.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.logout(userId, typeof refreshToken === 'string' ? refreshToken : undefined);
    this.authCookies.clearAuthCookies(res);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('me')
  me(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.me(user.id);
  }
}
