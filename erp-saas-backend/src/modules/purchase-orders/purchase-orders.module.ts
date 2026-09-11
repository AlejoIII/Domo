import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { InventoryModule } from '../../common/inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrdersRepository],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
