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
import { ManufacturingService } from './manufacturing.service';
import { CreateBomDto, QueryBomsDto, UpdateBomDto } from './dto/bom.dto';
import {
  CreateManufacturingOrderDto,
  QueryManufacturingOrdersDto,
  UpdateManufacturingOrderDto,
} from './dto/manufacturing-order.dto';

@ApiTags('Manufacturing')
@ApiBearerAuth()
@RequirePlanFeature('manufacturing')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly manufacturing: ManufacturingService) {}

  @Get('boms')
  @RequirePermissions('manufacturing.read')
  listBoms(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryBomsDto,
  ) {
    return this.manufacturing.findAllBoms(companyId, query);
  }

  @Post('boms')
  @RequirePermissions('manufacturing.write')
  createBom(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateBomDto,
  ) {
    return this.manufacturing.createBom(companyId, dto);
  }

  @Get('boms/:id')
  @RequirePermissions('manufacturing.read')
  getBom(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.manufacturing.findOneBom(id, companyId);
  }

  @Patch('boms/:id')
  @RequirePermissions('manufacturing.write')
  updateBom(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateBomDto,
  ) {
    return this.manufacturing.updateBom(id, companyId, dto);
  }

  @Delete('boms/:id')
  @RequirePermissions('manufacturing.write')
  removeBom(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.manufacturing.removeBom(id, companyId);
  }

  @Get('orders')
  @RequirePermissions('manufacturing.read')
  listOrders(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryManufacturingOrdersDto,
  ) {
    return this.manufacturing.findAllOrders(companyId, query);
  }

  @Post('orders')
  @RequirePermissions('manufacturing.write')
  createOrder(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateManufacturingOrderDto,
  ) {
    return this.manufacturing.createOrder(companyId, dto);
  }

  @Get('orders/:id')
  @RequirePermissions('manufacturing.read')
  getOrder(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.manufacturing.findOneOrder(id, companyId);
  }

  @Patch('orders/:id')
  @RequirePermissions('manufacturing.write')
  updateOrder(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateManufacturingOrderDto,
  ) {
    return this.manufacturing.updateOrder(id, companyId, dto);
  }

  @Post('orders/:id/complete')
  @RequirePermissions('manufacturing.write')
  completeOrder(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.manufacturing.completeOrder(id, companyId, userId);
  }

  @Post('orders/:id/revert')
  @RequirePermissions('manufacturing.write')
  revertOrder(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.manufacturing.revertCompleteOrder(id, companyId, userId);
  }

  @Post('orders/:id/cancel')
  @RequirePermissions('manufacturing.write')
  cancelOrder(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.manufacturing.cancelOrder(id, companyId);
  }

  @Delete('orders/:id')
  @RequirePermissions('manufacturing.write')
  removeOrder(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.manufacturing.removeOrder(id, companyId);
  }
}
