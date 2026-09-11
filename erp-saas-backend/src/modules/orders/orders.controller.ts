import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('orders.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryOrdersDto,
  ) {
    return this.ordersService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('orders.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.ordersService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('orders.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(companyId, dto, userId);
  }

  @Post(':id/convert-to-invoice')
  @RequirePermissions('orders.write')
  convertToInvoice(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.ordersService.convertToInvoice(id, companyId);
  }

  @Post(':id/duplicate')
  @RequirePermissions('orders.write')
  duplicate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.ordersService.duplicate(id, companyId);
  }

  @Post(':id/unconfirm')
  @RequirePermissions('orders.write')
  unconfirm(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.unconfirm(id, companyId, userId);
  }

  @Patch(':id')
  @RequirePermissions('orders.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, companyId, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('orders.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.remove(id, companyId, userId);
  }
}
