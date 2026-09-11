import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ApiKeyGuard } from './api-key.guard';
import { RequireApiScope } from './api-key.decorator';
import { CurrentApiCompany } from './current-api-key.decorator';

@ApiTags('Public API')
@ApiSecurity('apiKey')
@ApiHeader({ name: 'X-Api-Key', description: 'API key erp_test_...' })
@SkipThrottle()
@UseGuards(ApiKeyGuard)@Controller({ path: 'public', version: '1' })
export class PublicApiController {
  constructor(
    private readonly clients: ClientsService,
    private readonly products: ProductsService,
    private readonly orders: OrdersService,
    private readonly invoices: InvoicesService,
  ) {}

  @Get('clients')
  @RequireApiScope('clients.read')
  listClients(
    @CurrentApiCompany() companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clients.findAll(companyId, { page: page ?? 1, limit: limit ?? 25 });
  }

  @Get('clients/:id')
  @RequireApiScope('clients.read')
  getClient(@CurrentApiCompany() companyId: string, @Param('id') id: string) {
    return this.clients.findOne(id, companyId);
  }

  @Get('products')
  @RequireApiScope('products.read')
  listProducts(
    @CurrentApiCompany() companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.products.findAll(companyId, { page: page ?? 1, limit: limit ?? 25 });
  }

  @Get('products/:id')
  @RequireApiScope('products.read')
  getProduct(@CurrentApiCompany() companyId: string, @Param('id') id: string) {
    return this.products.findOne(id, companyId);
  }

  @Get('orders')
  @RequireApiScope('orders.read')
  listOrders(
    @CurrentApiCompany() companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orders.findAll(companyId, { page: page ?? 1, limit: limit ?? 25 });
  }

  @Get('orders/:id')
  @RequireApiScope('orders.read')
  getOrder(@CurrentApiCompany() companyId: string, @Param('id') id: string) {
    return this.orders.findOne(id, companyId);
  }

  @Get('invoices')
  @RequireApiScope('invoices.read')
  listInvoices(
    @CurrentApiCompany() companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoices.findAll(companyId, { page: page ?? 1, limit: limit ?? 25 });
  }

  @Get('invoices/:id')
  @RequireApiScope('invoices.read')
  getInvoice(@CurrentApiCompany() companyId: string, @Param('id') id: string) {
    return this.invoices.findOne(id, companyId);
  }
}
