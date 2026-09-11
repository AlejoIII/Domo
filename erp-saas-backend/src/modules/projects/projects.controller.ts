import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';
import { ProjectsService } from './projects.service';
import { TimeEntriesService } from './time-entries.service';
import {
  CreateProjectDto,
  GenerateProjectInvoiceDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/project.dto';
import {
  CreateTimeEntryDto,
  QueryTimeEntriesDto,
  UpdateTimeEntryDto,
} from './dto/time-entry.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@RequirePlanFeature('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly timeEntries: TimeEntriesService,
  ) {}

  @Get()
  @RequirePermissions('projects.read')
  listProjects(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryProjectsDto,
  ) {
    return this.projects.findAll(companyId, query);
  }

  @Post()
  @RequirePermissions('projects.write')
  createProject(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(companyId, dto);
  }

  @Get('time-entries')
  @RequirePermissions('projects.read')
  listAllTimeEntries(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryTimeEntriesDto,
  ) {
    return this.timeEntries.findAll(companyId, query);
  }

  @Patch('time-entries/:entryId')
  @RequirePermissions('projects.write')
  updateTimeEntry(
    @Param('entryId') entryId: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateTimeEntryDto,
  ) {
    return this.timeEntries.update(entryId, companyId, dto);
  }

  @Delete('time-entries/:entryId')
  @RequirePermissions('projects.write')
  removeTimeEntry(
    @Param('entryId') entryId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.timeEntries.remove(entryId, companyId);
  }

  @Get(':id/summary')
  @RequirePermissions('projects.read')
  projectSummary(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.projects.getSummary(id, companyId);
  }

  @Get(':id/time-entries')
  @RequirePermissions('projects.read')
  listProjectTimeEntries(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryTimeEntriesDto,
  ) {
    return this.timeEntries.findAll(companyId, { ...query, projectId: id });
  }

  @Post(':id/time-entries')
  @RequirePermissions('projects.write')
  createTimeEntry(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.timeEntries.create(id, companyId, dto);
  }

  @Post(':id/generate-invoice')
  @RequirePermissions('projects.write')
  generateInvoice(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: GenerateProjectInvoiceDto,
  ) {
    return this.projects.generateInvoice(id, companyId, dto);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  getProject(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.projects.findOne(id, companyId);
  }

  @Patch(':id')
  @RequirePermissions('projects.write')
  updateProject(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('projects.write')
  removeProject(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.projects.remove(id, companyId);
  }
}
