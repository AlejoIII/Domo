import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/quote.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { SendDocumentEmailDto } from '../documents/dto/send-document-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @RequirePermissions('quotes.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryQuotesDto,
  ) {
    return this.quotesService.findAll(companyId, query);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF generado en servidor' })
  @RequirePermissions('quotes.read')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.quotesService.getPdf(id, companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Get(':id')
  @RequirePermissions('quotes.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.quotesService.findOne(id, companyId);
  }

  @Post()
  @RequirePermissions('quotes.write')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(companyId, dto);
  }

  @Post(':id/convert-to-order')
  @RequirePermissions('quotes.write')
  convertToOrder(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.quotesService.convertToOrder(id, companyId);
  }

  @Post(':id/duplicate')
  @RequirePermissions('quotes.write')
  duplicate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.quotesService.duplicate(id, companyId);
  }

  @Post(':id/send-email')
  @RequirePermissions('quotes.write')
  sendEmail(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: SendDocumentEmailDto,
  ) {
    return this.quotesService.sendEmail(id, companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('quotes.write')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @RequirePermissions('quotes.write')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.quotesService.remove(id, companyId);
  }
}
