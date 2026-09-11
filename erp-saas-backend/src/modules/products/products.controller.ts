import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('products.read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: QueryProductsDto) {
    return this.productsService.findAll(companyId, query);
  }

  @Get('low-stock')
  @RequirePermissions('products.read')
  findLowStock(@CurrentUser('companyId') companyId: string) {
    return this.productsService.findLowStock(companyId);
  }

  @Get(':id/stock')
  @RequirePermissions('products.read')
  getStock(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.productsService.getStockBreakdown(id, companyId);
  }

  @Get(':id')
  @RequirePermissions('products.read')
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.productsService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('products.write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('products.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.write')
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.productsService.remove(id, companyId);
  }
}
