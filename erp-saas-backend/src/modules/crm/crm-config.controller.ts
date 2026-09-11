import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';
import { CrmConfigService } from './crm-config.service';
import {
  CreateCrmAcreliaAccountDto,
  CreateCrmCatalogItemDto,
  CreateCrmEmailTemplateDto,
  CreateCrmSmsTemplateDto,
  UpdateCrmAcreliaAccountDto,
  UpdateCrmCatalogItemDto,
  UpdateCrmEmailSettingsDto,
  UpdateCrmEmailTemplateDto,
  UpdateCrmSmsTemplateDto,
} from './dto/crm-config.dto';

@ApiTags('CRM Config')
@ApiBearerAuth()
@RequirePlanFeature('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('crm/config')
export class CrmConfigController {
  constructor(private readonly config: CrmConfigService) {}

  @Get('catalogs/:category')
  @RequirePermissions('crm.read')
  listCatalog(
    @Param('category') category: string,
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
  ) {
    return this.config.listCatalog(companyId, category, search);
  }

  @Post('catalogs/:category')
  @RequirePermissions('crm.write')
  createCatalogItem(
    @Param('category') category: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmCatalogItemDto,
  ) {
    return this.config.createCatalogItem(companyId, category, dto);
  }

  @Patch('catalogs/:category/:id')
  @RequirePermissions('crm.write')
  updateCatalogItem(
    @Param('category') category: string,
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmCatalogItemDto,
  ) {
    return this.config.updateCatalogItem(id, companyId, category, dto);
  }

  @Delete('catalogs/:category/:id')
  @RequirePermissions('crm.write')
  removeCatalogItem(
    @Param('category') category: string,
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.config.removeCatalogItem(id, companyId, category);
  }

  @Get('email-templates')
  @RequirePermissions('crm.read')
  listEmailTemplates(@CurrentUser('companyId') companyId: string) {
    return this.config.listEmailTemplates(companyId);
  }

  @Post('email-templates')
  @RequirePermissions('crm.write')
  createEmailTemplate(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmEmailTemplateDto,
  ) {
    return this.config.createEmailTemplate(companyId, dto);
  }

  @Patch('email-templates/:id')
  @RequirePermissions('crm.write')
  updateEmailTemplate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmEmailTemplateDto,
  ) {
    return this.config.updateEmailTemplate(id, companyId, dto);
  }

  @Delete('email-templates/:id')
  @RequirePermissions('crm.write')
  removeEmailTemplate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.config.removeEmailTemplate(id, companyId);
  }

  @Get('sms-templates')
  @RequirePermissions('crm.read')
  listSmsTemplates(@CurrentUser('companyId') companyId: string) {
    return this.config.listSmsTemplates(companyId);
  }

  @Post('sms-templates')
  @RequirePermissions('crm.write')
  createSmsTemplate(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmSmsTemplateDto,
  ) {
    return this.config.createSmsTemplate(companyId, dto);
  }

  @Patch('sms-templates/:id')
  @RequirePermissions('crm.write')
  updateSmsTemplate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmSmsTemplateDto,
  ) {
    return this.config.updateSmsTemplate(id, companyId, dto);
  }

  @Delete('sms-templates/:id')
  @RequirePermissions('crm.write')
  removeSmsTemplate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.config.removeSmsTemplate(id, companyId);
  }

  @Get('email-settings')
  @RequirePermissions('crm.read')
  getEmailSettings(@CurrentUser('companyId') companyId: string) {
    return this.config.getEmailSettings(companyId);
  }

  @Patch('email-settings')
  @RequirePermissions('crm.write')
  updateEmailSettings(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmEmailSettingsDto,
  ) {
    return this.config.updateEmailSettings(companyId, dto);
  }

  @Get('acrelia-accounts')
  @RequirePermissions('crm.read')
  listAcreliaAccounts(@CurrentUser('companyId') companyId: string) {
    return this.config.listAcreliaAccounts(companyId);
  }

  @Post('acrelia-accounts')
  @RequirePermissions('crm.write')
  createAcreliaAccount(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmAcreliaAccountDto,
  ) {
    return this.config.createAcreliaAccount(companyId, dto);
  }

  @Patch('acrelia-accounts/:id')
  @RequirePermissions('crm.write')
  updateAcreliaAccount(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmAcreliaAccountDto,
  ) {
    return this.config.updateAcreliaAccount(id, companyId, dto);
  }

  @Delete('acrelia-accounts/:id')
  @RequirePermissions('crm.write')
  removeAcreliaAccount(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.config.removeAcreliaAccount(id, companyId);
  }
}
