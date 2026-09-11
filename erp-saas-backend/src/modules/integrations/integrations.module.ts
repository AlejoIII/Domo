import { Global, Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { PublicApiController } from './public-api.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { WebhookEndpointService } from './webhook-endpoint.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Global()
@Module({
  imports: [ClientsModule, ProductsModule, OrdersModule, InvoicesModule],
  controllers: [IntegrationsController, PublicApiController],
  providers: [
    ApiKeyService,
    ApiKeyGuard,
    WebhookEndpointService,
    WebhookDispatcherService,
  ],
  exports: [WebhookDispatcherService, ApiKeyGuard],
})
export class IntegrationsModule {}
