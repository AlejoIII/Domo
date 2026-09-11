import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { CreateClientNoteDto } from './dto/client-note.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryClientsDto,
  ) {
    return this.clientsService.findAll(companyId, query);
  }

  @Get(':id/summary')
  @RequirePermissions('clients.read')
  summary(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.getSummary(id, companyId);
  }

  @Get(':id/timeline')
  @RequirePermissions('clients.read')
  timeline(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.getTimeline(id, companyId);
  }

  @Get(':id/notes')
  @RequirePermissions('clients.read')
  listNotes(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.listNotes(id, companyId);
  }

  @Post(':id/notes')
  @RequirePermissions('clients.write')
  createNote(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateClientNoteDto,
  ) {
    return this.clientsService.createNote(id, companyId, dto.text, userId);
  }

  @Delete(':id/notes/:noteId')
  @RequirePermissions('clients.write')
  removeNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.removeNote(id, noteId, companyId);
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('clients.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('clients.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('clients.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.clientsService.remove(id, companyId);
  }
}
