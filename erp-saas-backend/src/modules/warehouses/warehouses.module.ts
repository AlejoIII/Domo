import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';
import { InventoryModule } from '../../common/inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [WarehousesController],
  providers: [WarehousesService, WarehousesRepository],
  exports: [WarehousesService],
})
export class WarehousesModule {}
