import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { QueryPurchaseOrdersDto } from './dto/query-purchase-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @RequirePermissions('suppliers.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryPurchaseOrdersDto,
  ) {
    return this.purchaseOrdersService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.purchaseOrdersService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(companyId, dto, userId);
  }

  @Post(':id/duplicate')
  @RequirePermissions('suppliers.write')
  duplicate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.purchaseOrdersService.duplicate(id, companyId);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, companyId, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.remove(id, companyId, userId);
  }
}
