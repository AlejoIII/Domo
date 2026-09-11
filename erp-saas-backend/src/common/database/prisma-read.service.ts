import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { READ_PRISMA } from './database.tokens';

@Injectable()
export class PrismaReadService implements OnModuleInit, OnModuleDestroy {
  private readonly replica: PrismaClient | null;
  readonly isReplica: boolean;

  constructor(
    private readonly primary: PrismaService,
    config: ConfigService,
  ) {
    const readUrl = config.get<string>('DATABASE_READ_URL');
    if (readUrl) {
      this.replica = new PrismaClient({
        datasources: { db: { url: readUrl } },
      });
      this.isReplica = true;
    } else {
      this.replica = null;
      this.isReplica = false;
    }
  }

  /** Prisma client for read-heavy queries (replica or primary fallback). */
  get client(): PrismaClient {
    return this.replica ?? this.primary;
  }

  async onModuleInit() {
    if (this.replica) await this.replica.$connect();
  }

  async onModuleDestroy() {
    if (this.replica) await this.replica.$disconnect();
  }
}

/** Inject read-optimized Prisma client in services. */
export const InjectReadPrisma = () => Inject(READ_PRISMA);
