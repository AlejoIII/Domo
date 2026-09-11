import { Global, Module } from '@nestjs/common';
import { BetaService } from './beta.service';

@Global()
@Module({
  providers: [BetaService],
  exports: [BetaService],
})
export class BetaModule {}
