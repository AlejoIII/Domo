import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto, UpsertWarehouseStockDto } from './dto/warehouse.dto';
import { QueryWarehousesDto } from './dto/query-warehouses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('products.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryWarehousesDto,
  ) {
    return this.warehousesService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('products.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.warehousesService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('products.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('products.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, companyId, dto);
  }

  @Patch(':id/stock')
  @RequirePermissions('products.write')
  upsertStock(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpsertWarehouseStockDto,
  ) {
    return this.warehousesService.upsertStock(id, companyId, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('products.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.warehousesService.remove(id, companyId);
  }
}
