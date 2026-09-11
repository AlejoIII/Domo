import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QuerySuppliersDto,
  ) {
    return this.suppliersService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.suppliersService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.suppliersService.remove(id, companyId);
  }
}
