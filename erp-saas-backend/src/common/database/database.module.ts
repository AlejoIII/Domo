import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { PrismaReadService } from './prisma-read.service';
import { READ_PRISMA } from './database.tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PrismaService,
      useFactory: (config: ConfigService) => new PrismaService(config),
      inject: [ConfigService],
    },
    PrismaReadService,
    {
      provide: READ_PRISMA,
      useFactory: (read: PrismaReadService) => read.client,
      inject: [PrismaReadService],
    },
  ],
  exports: [PrismaService, PrismaReadService, READ_PRISMA],
})
export class DatabaseModule {}
