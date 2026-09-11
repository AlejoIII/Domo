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
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import {
  CreateBankMovementDto,
  ImportBankMovementsDto,
  ReconcileMovementDto,
} from './dto/bank-movement.dto';
import { QueryBankMovementsDto } from './dto/query-bank-movements.dto';
import { TreasuryAccountsService } from './treasury-accounts.service';
import { TreasuryMovementsService } from './treasury-movements.service';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';

@ApiTags('Treasury')
@ApiBearerAuth()
@RequirePlanFeature('treasury')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('treasury')
export class TreasuryController {
  constructor(
    private readonly accounts: TreasuryAccountsService,
    private readonly movements: TreasuryMovementsService,
    private readonly reconciliation: TreasuryReconciliationService,
  ) {}

  @Get('accounts')
  @RequirePermissions('treasury.read')
  listAccounts(@CurrentUser('companyId') companyId: string) {
    return this.accounts.findAll(companyId);
  }

  @Get('accounts/:id')
  @RequirePermissions('treasury.read')
  getAccount(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.accounts.findOne(id, companyId);
  }

  @Post('accounts')
  @RequirePermissions('treasury.write')
  createAccount(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.accounts.create(companyId, dto);
  }

  @Patch('accounts/:id')
  @RequirePermissions('treasury.write')
  updateAccount(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.accounts.update(id, companyId, dto);
  }

  @Delete('accounts/:id')
  @RequirePermissions('treasury.write')
  removeAccount(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.accounts.remove(id, companyId);
  }

  @Get('movements')
  @RequirePermissions('treasury.read')
  listMovements(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryBankMovementsDto,
  ) {
    return this.movements.findAll(companyId, query);
  }

  @Post('movements')
  @RequirePermissions('treasury.write')
  createMovement(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankMovementDto,
  ) {
    return this.movements.create(companyId, dto, userId);
  }

  @Post('movements/import')
  @RequirePermissions('treasury.write')
  importMovements(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ImportBankMovementsDto,
  ) {
    return this.movements.importCsv(companyId, dto, userId);
  }

  @Get('reconciliation')
  @RequirePermissions('treasury.read')
  reconciliationBoard(
    @CurrentUser('companyId') companyId: string,
    @Query('bankAccountId') bankAccountId?: string,
  ) {
    return this.reconciliation.getReconciliationBoard(companyId, bankAccountId);
  }

  @Post('movements/:id/reconcile')
  @RequirePermissions('treasury.write')
  reconcile(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: ReconcileMovementDto,
  ) {
    return this.reconciliation.reconcile(companyId, id, dto.paymentId);
  }

  @Delete('movements/:id/reconcile')
  @RequirePermissions('treasury.write')
  unreconcile(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reconciliation.unreconcile(companyId, id);
  }
}
