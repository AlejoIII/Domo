import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateVerifactuSettingsDto } from './dto/verifactu-settings.dto';
import { VerifactuSettingsService } from './verifactu-settings.service';
import { VerifactuRecordService } from './verifactu-record.service';

@ApiTags('Verifactu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('verifactu')
export class VerifactuController {
  constructor(
    private readonly settings: VerifactuSettingsService,
    private readonly records: VerifactuRecordService,
  ) {}

  @Get('settings')
  @RequireAdmin()
  @RequirePermissions('settings.read')
  getSettings(@CurrentUser('companyId') companyId: string) {
    return this.settings.getSettings(companyId);
  }

  @Patch('settings')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  updateSettings(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateVerifactuSettingsDto,
  ) {
    return this.settings.updateSettings(companyId, dto);
  }

  @Get('chain')
  @RequirePermissions('invoices.read')
  getChain(@CurrentUser('companyId') companyId: string) {
    return this.records.getChainStatus(companyId);
  }

  @Get('records')
  @RequirePermissions('invoices.read')
  listRecords(
    @CurrentUser('companyId') companyId: string,
    @Query('take') take?: string,
  ) {
    return this.records.listRecords(companyId, take ? Number(take) : 50);
  }

  @Get('records/:id')
  @RequirePermissions('invoices.read')
  getRecord(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.records.getRecord(companyId, id);
  }

  @Post('records/:id/retry')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  retry(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.records.retryRemit(companyId, id);
  }
}
