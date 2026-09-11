import { Module } from '@nestjs/common';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { InventoryModule } from '../../common/inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [ManufacturingController],
  providers: [ManufacturingService],
})
export class ManufacturingModule {}
