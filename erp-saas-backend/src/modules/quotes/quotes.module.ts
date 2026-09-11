import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuotesRepository } from './quotes.repository';
import { OrdersModule } from '../orders/orders.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [OrdersModule, MailModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuotesRepository],
  exports: [QuotesService],
})
export class QuotesModule {}
