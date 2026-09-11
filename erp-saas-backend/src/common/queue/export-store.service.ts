import { createHash, randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { RedisService } from '../redis/redis.service';

export type ExportReportType = 'sales' | 'finance';
export type ExportFormat = 'csv' | 'xlsx';
export type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJobMeta {
  jobId: string;
  companyId: string;
  reportType: ExportReportType;
  format: ExportFormat;
  status: ExportJobStatus;
  fileName?: string;
  mimeType?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const META_PREFIX = 'domo:export:meta:';
const META_TTL_SEC = 3600;

@Injectable()
export class ExportStoreService {
  private readonly logger = new Logger(ExportStoreService.name);
  private readonly memory = new Map<string, ExportJobMeta>();
  private readonly exportDir: string;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.exportDir = join(process.cwd(), 'uploads', 'exports');
  }

  buildJobId(companyId: string, reportType: ExportReportType, query: Record<string, unknown>) {
    const hash = createHash('sha256')
      .update(JSON.stringify({ companyId, reportType, query }))
      .digest('hex')
      .slice(0, 24);
    return `export-${reportType}-${hash}`;
  }

  async createQueued(meta: Omit<ExportJobMeta, 'status' | 'createdAt'>): Promise<ExportJobMeta> {
    const record: ExportJobMeta = {
      ...meta,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    await this.saveMeta(record);
    return record;
  }

  async getMeta(jobId: string, companyId?: string): Promise<ExportJobMeta | null> {
    const meta = await this.loadMeta(jobId);
    if (!meta) return null;
    if (companyId && meta.companyId !== companyId) return null;
    return meta;
  }

  async markProcessing(jobId: string) {
    const meta = await this.loadMeta(jobId);
    if (!meta) return;
    meta.status = 'processing';
    await this.saveMeta(meta);
  }

  async markCompleted(jobId: string, fileName: string, mimeType: string) {
    const meta = await this.loadMeta(jobId);
    if (!meta) return;
    meta.status = 'completed';
    meta.fileName = fileName;
    meta.mimeType = mimeType;
    meta.completedAt = new Date().toISOString();
    await this.saveMeta(meta);
  }

  async markFailed(jobId: string, error: string) {
    const meta = await this.loadMeta(jobId);
    if (!meta) return;
    meta.status = 'failed';
    meta.error = error;
    meta.completedAt = new Date().toISOString();
    await this.saveMeta(meta);
  }

  async saveFile(companyId: string, jobId: string, ext: string, content: Buffer | string) {
    const dir = join(this.exportDir, companyId);
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, `${jobId}.${ext}`);
    await writeFile(filePath, content);
    return filePath;
  }

  async readFile(companyId: string, jobId: string, ext: string): Promise<Buffer> {
    const filePath = join(this.exportDir, companyId, `${jobId}.${ext}`);
    try {
      return await readFile(filePath);
    } catch {
      throw new NotFoundException('Archivo de exportación no encontrado o expirado');
    }
  }

  newJobId() {
    return randomUUID();
  }

  private metaKey(jobId: string) {
    return `${META_PREFIX}${jobId}`;
  }

  private async saveMeta(meta: ExportJobMeta) {
    const serialized = JSON.stringify(meta);
    this.memory.set(meta.jobId, meta);
    await this.redis.set(this.metaKey(meta.jobId), serialized, META_TTL_SEC);
  }

  private async loadMeta(jobId: string): Promise<ExportJobMeta | null> {
    const fromRedis = await this.redis.get(this.metaKey(jobId));
    if (fromRedis) {
      try {
        const parsed = JSON.parse(fromRedis) as ExportJobMeta;
        this.memory.set(jobId, parsed);
        return parsed;
      } catch {
        this.logger.warn(`Invalid export meta for ${jobId}`);
      }
    }
    return this.memory.get(jobId) ?? null;
  }
}
