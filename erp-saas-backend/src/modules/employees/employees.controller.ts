import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@RequirePlanFeature('hr')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions('employees.read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: QueryEmployeesDto) {
    return this.employeesService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('employees.read')
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.employeesService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('employees.write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('employees.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('employees.write')
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.employeesService.remove(id, companyId);
  }
}
