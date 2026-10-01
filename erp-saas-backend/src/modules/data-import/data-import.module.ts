import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { InventoryModule } from '../../common/inventory/inventory.module';

@Module({
  imports: [ClientsModule, ProductsModule, WarehousesModule, InventoryModule],
  controllers: [DataImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
