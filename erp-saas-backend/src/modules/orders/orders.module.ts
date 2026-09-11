import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { InvoicesModule } from '../invoices/invoices.module';
import { InventoryModule } from '../../common/inventory/inventory.module';

@Module({
  imports: [InvoicesModule, InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
