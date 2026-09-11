import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

const PARTITIONED_PARENTS = ['audit_logs', 'webhook_deliveries'] as const;

const PARTITION_NAME_RE = /^(audit_logs|webhook_deliveries)_(\d{4})_(\d{2})$/;

export interface AuditPurgeResult {
  dryRun: boolean;
  retentionMonths: number;
  cutoffMonth: string;
  dropped: string[];
  skipped: string[];
}

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Elimina particiones mensuales anteriores al cutoff (retención por defecto: 12 meses). */
  async purgeExpiredPartitions(): Promise<AuditPurgeResult> {
    const retentionMonths = this.resolveRetentionMonths();
    const dryRun = this.isDryRun();
    const cutoff = this.cutoffMonthStart(retentionMonths);
    const cutoffMonth = this.formatYearMonth(cutoff);

    const dropped: string[] = [];
    const skipped: string[] = [];

    for (const parent of PARTITIONED_PARENTS) {
      const partitions = await this.listChildPartitions(parent);
      for (const name of partitions) {
        const parsed = this.parsePartitionMonth(name);
        if (!parsed) {
          skipped.push(name);
          continue;
        }
        if (parsed >= cutoff) {
          skipped.push(name);
          continue;
        }

        if (dryRun) {
          this.logger.log(`[dry-run] Drop partition ${name} (< ${cutoffMonth})`);
          dropped.push(name);
          continue;
        }

        await this.dropPartition(name);
        this.logger.warn(`Dropped partition ${name} (retention ${retentionMonths}m, cutoff ${cutoffMonth})`);
        dropped.push(name);
      }
    }

    return { dryRun, retentionMonths, cutoffMonth, dropped, skipped };
  }

  private resolveRetentionMonths(): number {
    const raw = this.config.get<string | number>('AUDIT_RETENTION_MONTHS', 12);
    const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 12;
    return Math.min(parsed, 120);
  }

  private isDryRun(): boolean {
    const value = this.config.get<string>('AUDIT_RETENTION_DRY_RUN', 'false');
    return value === '1' || value === 'true';
  }

  /** Primer día del mes actual menos N meses (UTC). */
  private cutoffMonthStart(retentionMonths: number): Date {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-based
    return new Date(Date.UTC(year, month - retentionMonths, 1));
  }

  private formatYearMonth(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private parsePartitionMonth(name: string): Date | null {
    const match = PARTITION_NAME_RE.exec(name);
    if (!match) return null;
    const year = Number.parseInt(match[2]!, 10);
    const month = Number.parseInt(match[3]!, 10);
    if (month < 1 || month > 12) return null;
    return new Date(Date.UTC(year, month - 1, 1));
  }

  private async listChildPartitions(parent: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ relname: string }[]>`
      SELECT c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
      JOIN pg_class p ON p.oid = i.inhparent
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.relname = ${parent}
        AND n.nspname = 'public'
      ORDER BY c.relname
    `;
    return rows.map((r) => r.relname);
  }

  private async dropPartition(name: string): Promise<void> {
    if (!PARTITION_NAME_RE.test(name)) {
      throw new Error(`Refusing to drop unexpected partition name: ${name}`);
    }
    // Nombre validado por regex estricta; DROP con identificador entrecomillado
    await this.prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${name}"`);
  }
}
