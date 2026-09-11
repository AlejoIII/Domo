import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireAdmin } from '../../common/decorators/admin.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions/all')
  @RequireAdmin()
  @RequirePermissions('settings.read')
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get()
  @RequireAdmin()
  @RequirePermissions('settings.read')
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.rolesService.findAll(companyId);
  }

  @Get(':id')
  @RequireAdmin()
  @RequirePermissions('settings.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.rolesService.findOne(id, companyId);
  }

  @Post()
  @RequireAdmin()
  @RequirePermissions('settings.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(companyId, dto);
  }

  @Patch(':id')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequireAdmin()
  @RequirePermissions('settings.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.rolesService.remove(id, companyId);
  }
}
