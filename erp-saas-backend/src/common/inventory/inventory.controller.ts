import {
  Body, Controller, Get, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { InventoryService } from './inventory.service';
import {
  CreateStockTransferDto,
  QueryStockMovementsDto,
  StockValuationQueryDto,
} from './dto/inventory.dto';
import { buildMovementsCsv, buildStockValuationCsv } from './inventory-export.util';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('movements')
  @RequirePermissions('products.read')
  listMovements(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryStockMovementsDto,
  ) {
    return this.inventoryService.listMovements(companyId, query);
  }

  @Get('movements/export')
  @RequirePermissions('products.read')
  async exportMovements(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryStockMovementsDto,
    @Res() res: Response,
  ) {
    const items = await this.inventoryService.listAllMovements(companyId, query);
    const csv = buildMovementsCsv(items);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="movimientos_stock_${stamp}.csv"`);
    res.send(csv);
  }

  @Post('transfers')
  @RequirePermissions('products.write')
  createTransfer(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.inventoryService.transferStock(
      companyId,
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.productId,
      dto.quantity,
      dto.notes,
      userId,
    );
  }

  @Get('valuation')
  @RequirePermissions('reports.read')
  stockValuation(
    @CurrentUser('companyId') companyId: string,
    @Query() query: StockValuationQueryDto,
  ) {
    return this.inventoryService.stockValuation(companyId, query.warehouseId);
  }

  @Get('valuation/export')
  @RequirePermissions('reports.read')
  async exportStockValuation(
    @CurrentUser('companyId') companyId: string,
    @Query() query: StockValuationQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.inventoryService.stockValuation(companyId, query.warehouseId);
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true },
    });
    const csv = buildStockValuationCsv(data, company?.name ?? 'Empresa');
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="valoracion_stock_${stamp}.csv"`);
    res.send(csv);
  }
}
