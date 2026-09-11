import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { CreateCreditNoteDto } from './dto/credit-note.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { SendDocumentEmailDto } from '../documents/dto/send-document-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('invoices.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryInvoicesDto,
  ) {
    return this.invoicesService.findAll(companyId, query);
  }

  @Delete('payments/:paymentId')
  @RequirePermissions('invoices.write')
  removePayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.removePayment(paymentId, companyId);
  }

  @Get(':id/payments')
  @RequirePermissions('invoices.read')
  listPayments(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.listPayments(id, companyId);
  }

  @Post(':id/payments')
  @RequirePermissions('invoices.write')
  createPayment(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.invoicesService.createPayment(id, companyId, dto, userId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF generado en servidor' })
  @RequirePermissions('invoices.read')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.invoicesService.getPdf(id, companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('invoices.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(companyId, dto);
  }

  @Post(':id/duplicate')
  @RequirePermissions('invoices.write')
  duplicate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.duplicate(id, companyId);
  }

  @Post(':id/credit-note')
  @ApiOperation({ summary: 'Emitir factura rectificativa (total o parcial)' })
  @RequirePermissions('invoices.write')
  createCreditNote(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCreditNoteDto,
  ) {
    return this.invoicesService.createCreditNote(id, companyId, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('invoices.write')
  cancel(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.cancel(id, companyId);
  }

  @Post(':id/send-email')
  @RequirePermissions('invoices.write')
  sendEmail(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: SendDocumentEmailDto,
  ) {
    return this.invoicesService.sendEmail(id, companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('invoices.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('invoices.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.invoicesService.remove(id, companyId);
  }
}
