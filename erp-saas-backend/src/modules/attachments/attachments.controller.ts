import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto, QueryAttachmentsDto } from './dto/attachment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

type AuthUser = {
  id: string;
  companyId: string;
  roleName?: string | null;
  permissions?: string[];
};

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  findByEntity(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryAttachmentsDto,
  ) {
    this.attachmentsService.checkPermission(user, query.entityType, 'read');
    return this.attachmentsService.findByEntity(user.companyId, query.entityType, query.entityId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachmentsService.create(user.companyId, user.id, user, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.remove(id, user.companyId, user);
  }
}
