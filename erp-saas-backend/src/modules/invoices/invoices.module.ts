import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { MailModule } from '../../common/mail/mail.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [MailModule, AccountingModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService],
})
export class InvoicesModule {}
