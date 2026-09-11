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
import { CrmStagesService } from './crm-stages.service';
import { CrmLeadsService } from './crm-leads.service';
import { CrmOpportunitiesService } from './crm-opportunities.service';
import { CrmActivitiesService } from './crm-activities.service';
import {
  ConvertCrmLeadDto,
  CreateCrmLeadDto,
  QueryCrmLeadsDto,
  UpdateCrmLeadDto,
} from './dto/crm-lead.dto';
import {
  ConvertOpportunityToQuoteDto,
  CreateCrmOpportunityDto,
  MoveCrmOpportunityStageDto,
  QueryCrmOpportunitiesDto,
  UpdateCrmOpportunityDto,
} from './dto/crm-opportunity.dto';
import {
  CreateCrmActivityDto,
  QueryCrmActivitiesDto,
  UpdateCrmActivityDto,
} from './dto/crm-activity.dto';
import {
  CreateCrmStageDto,
  ReorderCrmStagesDto,
  UpdateCrmStageDto,
} from './dto/crm-stage.dto';
import {
  CreateCrmIncidentDto,
  QueryCrmIncidentsDto,
  UpdateCrmIncidentDto,
} from './dto/crm-incident.dto';
import { SendCrmEmailDto, SendCrmSmsDto } from './dto/crm-communication.dto';
import { CrmIncidentsService } from './crm-incidents.service';
import { CrmCommunicationsService } from './crm-communications.service';

@ApiTags('CRM')
@ApiBearerAuth()
@RequirePlanFeature('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('crm')
export class CrmController {
  constructor(
    private readonly stages: CrmStagesService,
    private readonly leads: CrmLeadsService,
    private readonly opportunities: CrmOpportunitiesService,
    private readonly activities: CrmActivitiesService,
    private readonly incidents: CrmIncidentsService,
    private readonly communications: CrmCommunicationsService,
  ) {}

  @Get('stages')
  @RequirePermissions('crm.read')
  listStages(@CurrentUser('companyId') companyId: string) {
    return this.stages.listStages(companyId);
  }

  @Post('stages')
  @RequirePermissions('crm.write')
  createStage(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmStageDto,
  ) {
    return this.stages.createStage(companyId, dto);
  }

  @Patch('stages/reorder')
  @RequirePermissions('crm.write')
  reorderStages(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: ReorderCrmStagesDto,
  ) {
    return this.stages.reorderStages(companyId, dto);
  }

  @Patch('stages/:id')
  @RequirePermissions('crm.write')
  updateStage(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmStageDto,
  ) {
    return this.stages.updateStage(companyId, id, dto);
  }

  @Delete('stages/:id')
  @RequirePermissions('crm.write')
  removeStage(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Query('moveToStageId') moveToStageId?: string,
  ) {
    return this.stages.removeStage(companyId, id, moveToStageId);
  }

  @Get('pipeline')
  @RequirePermissions('crm.read')
  pipeline(@CurrentUser('companyId') companyId: string) {
    return this.opportunities.getPipeline(companyId);
  }

  @Get('leads')
  @RequirePermissions('crm.read')
  listLeads(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCrmLeadsDto,
  ) {
    return this.leads.findAll(companyId, query);
  }

  @Get('leads/:id')
  @RequirePermissions('crm.read')
  getLead(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.leads.findOne(id, companyId);
  }

  @Post('leads')
  @RequirePermissions('crm.write')
  createLead(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmLeadDto,
  ) {
    return this.leads.create(companyId, dto);
  }

  @Patch('leads/:id')
  @RequirePermissions('crm.write')
  updateLead(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmLeadDto,
  ) {
    return this.leads.update(id, companyId, dto);
  }

  @Post('leads/:id/convert')
  @RequirePermissions('crm.write')
  convertLead(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: ConvertCrmLeadDto,
  ) {
    return this.leads.convert(id, companyId, dto);
  }

  @Delete('leads/:id')
  @RequirePermissions('crm.write')
  removeLead(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.leads.remove(id, companyId);
  }

  @Get('opportunities')
  @RequirePermissions('crm.read')
  listOpportunities(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCrmOpportunitiesDto,
  ) {
    return this.opportunities.findAll(companyId, query);
  }

  @Get('opportunities/:id')
  @RequirePermissions('crm.read')
  getOpportunity(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.opportunities.findOne(id, companyId);
  }

  @Post('opportunities')
  @RequirePermissions('crm.write')
  createOpportunity(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmOpportunityDto,
  ) {
    return this.opportunities.create(companyId, dto);
  }

  @Patch('opportunities/:id')
  @RequirePermissions('crm.write')
  updateOpportunity(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmOpportunityDto,
  ) {
    return this.opportunities.update(id, companyId, dto);
  }

  @Patch('opportunities/:id/stage')
  @RequirePermissions('crm.write')
  moveOpportunityStage(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: MoveCrmOpportunityStageDto,
  ) {
    return this.opportunities.moveStage(id, companyId, dto);
  }

  @Post('opportunities/:id/convert-to-quote')
  @RequirePermissions('crm.write')
  convertToQuote(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: ConvertOpportunityToQuoteDto,
  ) {
    return this.opportunities.convertToQuote(id, companyId, dto);
  }

  @Delete('opportunities/:id')
  @RequirePermissions('crm.write')
  removeOpportunity(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.opportunities.remove(id, companyId);
  }

  @Get('activities')
  @RequirePermissions('crm.read')
  listActivities(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCrmActivitiesDto,
  ) {
    return this.activities.findAll(companyId, query);
  }

  @Post('activities')
  @RequirePermissions('crm.write')
  createActivity(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCrmActivityDto,
  ) {
    return this.activities.create(companyId, dto, userId);
  }

  @Patch('activities/:id')
  @RequirePermissions('crm.write')
  updateActivity(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmActivityDto,
  ) {
    return this.activities.update(id, companyId, dto);
  }

  @Post('activities/:id/complete')
  @RequirePermissions('crm.write')
  completeActivity(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.activities.complete(id, companyId);
  }

  @Delete('activities/:id')
  @RequirePermissions('crm.write')
  removeActivity(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.activities.remove(id, companyId);
  }

  @Get('incidents')
  @RequirePermissions('crm.read')
  listIncidents(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCrmIncidentsDto,
  ) {
    return this.incidents.findAll(companyId, query);
  }

  @Get('incidents/:id')
  @RequirePermissions('crm.read')
  getIncident(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.incidents.findOne(id, companyId);
  }

  @Post('incidents')
  @RequirePermissions('crm.write')
  createIncident(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCrmIncidentDto,
  ) {
    return this.incidents.create(companyId, dto);
  }

  @Patch('incidents/:id')
  @RequirePermissions('crm.write')
  updateIncident(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateCrmIncidentDto,
  ) {
    return this.incidents.update(id, companyId, dto);
  }

  @Delete('incidents/:id')
  @RequirePermissions('crm.write')
  removeIncident(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.incidents.remove(id, companyId);
  }

  @Post('send-email')
  @RequirePermissions('crm.write')
  sendEmail(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendCrmEmailDto,
  ) {
    return this.communications.sendEmail(companyId, userId, dto);
  }

  @Post('send-sms')
  @RequirePermissions('crm.write')
  sendSms(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendCrmSmsDto,
  ) {
    return this.communications.sendSms(companyId, userId, dto);
  }
}
