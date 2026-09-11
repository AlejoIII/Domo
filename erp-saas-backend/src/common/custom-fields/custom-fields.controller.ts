import {
  Body, Controller, Delete, Get, Param, Put, UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomFieldsService } from './custom-fields.service';
import { SaveCustomFieldsDto } from './dto/save-custom-fields.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get(':entityType/:entityId')
  getValues(
    @CurrentUser('companyId') companyId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    try {
      return this.customFieldsService.getValues(companyId, entityType, entityId);
    } catch {
      throw new BadRequestException('Tipo de entidad no válido');
    }
  }

  @Put(':entityType/:entityId')
  saveValues(
    @CurrentUser('companyId') companyId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: SaveCustomFieldsDto,
  ) {
    try {
      return this.customFieldsService.saveValues(
        companyId,
        entityType,
        entityId,
        dto.values ?? {},
      );
    } catch {
      throw new BadRequestException('Tipo de entidad no válido');
    }
  }

  @Delete(':entityType/:entityId')
  deleteValues(
    @CurrentUser('companyId') companyId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    try {
      return this.customFieldsService.deleteValues(companyId, entityType, entityId);
    } catch {
      throw new BadRequestException('Tipo de entidad no válido');
    }
  }
}
