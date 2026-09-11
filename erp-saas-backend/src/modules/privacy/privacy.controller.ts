import {
  Body, Controller, Delete, Get, Param, Post, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { AnonymizeClientDto, DeleteCompanyDataDto } from './dto/privacy.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';

@ApiTags('Privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('retention')
  @ApiOperation({ summary: 'Política de retención de datos' })
  retention() {
    return this.privacyService.retentionPolicy();
  }

  @Get('export')
  @ApiOperation({ summary: 'Descargar todos los datos de la empresa (portabilidad RGPD)' })
  @RequireAdmin()
  @RequirePermissions('settings.write')
  async exportCompany(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const payload = await this.privacyService.exportCompanyData(companyId, userId);
    const stamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="domo-export-${stamp}.json"`,
    });
    res.end(JSON.stringify(payload, null, 2));
  }

  @Get('clients/:id/export')
  @ApiOperation({ summary: 'Datos personales de un cliente (derecho de acceso)' })
  @RequirePermissions('clients.read')
  exportClient(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.privacyService.exportClientData(id, companyId, userId);
  }

  @Post('clients/:id/anonymize')
  @ApiOperation({ summary: 'Suprimir datos personales de un cliente conservando el histórico fiscal' })
  @RequirePermissions('clients.write')
  anonymizeClient(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AnonymizeClientDto,
  ) {
    return this.privacyService.anonymizeClient(id, companyId, dto, userId);
  }

  @Delete('company')
  @ApiOperation({ summary: 'Baja de cuenta y supresión de datos personales' })
  @RequireAdmin()
  @RequirePermissions('settings.write')
  deleteCompany(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteCompanyDataDto,
  ) {
    return this.privacyService.deleteCompanyData(companyId, dto, userId);
  }
}
