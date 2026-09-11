import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';
import { ApiKeyService } from './api-key.service';
import { WebhookEndpointService } from './webhook-endpoint.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { API_SCOPES, WEBHOOK_EVENTS } from './integrations.constants';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@RequireAdmin()
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly webhooks: WebhookEndpointService,
    private readonly dispatcher: WebhookDispatcherService,
  ) {}

  @Get('meta')
  @RequirePermissions('settings.read')
  getMeta() {
    return {
      scopes: API_SCOPES,
      events: WEBHOOK_EVENTS,
      publicApiBase: '/api/v1/public',
      docsUrl: '/docs',
    };
  }

  @Get('api-keys')
  @RequirePlanFeature('api')
  @RequirePermissions('api.manage')
  listApiKeys(@CurrentUser('companyId') companyId: string) {
    return this.apiKeys.listKeys(companyId);
  }

  @Post('api-keys')
  @RequirePlanFeature('api')
  @RequirePermissions('api.manage')
  createApiKey(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.createKey(companyId, dto);
  }

  @Delete('api-keys/:id')
  @RequirePlanFeature('api')
  @RequirePermissions('api.manage')
  revokeApiKey(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.apiKeys.revokeKey(companyId, id);
  }

  @Get('webhooks')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  listWebhooks(@CurrentUser('companyId') companyId: string) {
    return this.webhooks.listEndpoints(companyId);
  }

  @Get('webhooks/deliveries')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  listDeliveries(@CurrentUser('companyId') companyId: string) {
    return this.webhooks.listDeliveries(companyId);
  }

  @Post('webhooks')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  createWebhook(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooks.createEndpoint(companyId, dto);
  }

  @Patch('webhooks/:id')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  updateWebhook(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooks.updateEndpoint(companyId, id, dto);
  }

  @Delete('webhooks/:id')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  deleteWebhook(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.webhooks.deleteEndpoint(companyId, id);
  }

  @Post('webhooks/:id/test')
  @RequirePlanFeature('webhooks')
  @RequirePermissions('api.manage')
  testWebhook(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.dispatcher.dispatchTest(companyId, id);
  }
}
