import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { DataImportService } from './data-import.service';
import { ImportCsvDto, ImportProductsCsvDto } from './dto/import-csv.dto';

type AuthUser = { companyId: string; sub: string };

@ApiTags('Data import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('data-import')
export class DataImportController {
  constructor(private readonly dataImport: DataImportService) {}

  @Get('templates/:type')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  getTemplate(@Param('type') type: string) {
    if (!['warehouses', 'clients', 'products'].includes(type)) {
      throw new BadRequestException('Tipo de plantilla no válido');
    }
    const { filename, content } = this.dataImport.getTemplate(
      type as 'warehouses' | 'clients' | 'products',
    );
    return { filename, content };
  }

  @Post('warehouses')
  @RequirePermissions('products.write')
  importWarehouses(@CurrentUser() user: AuthUser, @Body() dto: ImportCsvDto) {
    return this.dataImport.importWarehouses(user.companyId, dto.csv, dto.dryRun ?? false);
  }

  @Post('clients')
  @RequirePermissions('clients.write')
  importClients(@CurrentUser() user: AuthUser, @Body() dto: ImportCsvDto) {
    return this.dataImport.importClients(user.companyId, dto.csv, dto.dryRun ?? false);
  }

  @Post('products')
  @RequirePermissions('products.write')
  importProducts(@CurrentUser() user: AuthUser, @Body() dto: ImportProductsCsvDto) {
    return this.dataImport.importProducts(
      user.companyId,
      dto.csv,
      dto.dryRun ?? false,
      dto.defaultWarehouseCode,
    );
  }
}
