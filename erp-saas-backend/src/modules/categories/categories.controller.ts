import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('products.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('products.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.categoriesService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('products.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('products.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.categoriesService.remove(id, companyId);
  }
}
