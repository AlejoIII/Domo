import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageDriver, StorageDriverAdapter } from './storage.types';
import { LocalStorageDriver } from './drivers/local.storage';
import { S3StorageDriver } from './drivers/s3.storage';
import { buildUploadPath, parseUploadPath } from './storage.utils';

const DEFAULT_SIGNED_URL_TTL = 15 * 60;

@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;
  private readonly adapter: StorageDriverAdapter;
  private readonly signedUrlTtl: number;

  constructor(
    private readonly config: ConfigService,
    localDriver: LocalStorageDriver,
    s3Driver: S3StorageDriver,
  ) {
    const configured = this.config.get<string>('STORAGE_DRIVER', 'local').toLowerCase();
    this.driver = configured === 's3' ? 's3' : 'local';
    this.adapter = this.driver === 's3' ? s3Driver : localDriver;
    const ttl = Number.parseInt(this.config.get('SIGNED_URL_TTL_SECONDS', String(DEFAULT_SIGNED_URL_TTL)), 10);
    this.signedUrlTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_SIGNED_URL_TTL;
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  getSignedUrlTtl() {
    return this.signedUrlTtl;
  }

  upload(buffer: Buffer, key: string, contentType: string) {
    return this.adapter.upload(buffer, key, contentType);
  }

  delete(key: string) {
    return this.adapter.delete(key);
  }

  deleteByPath(pathOrUrl: string) {
    const key = parseUploadPath(pathOrUrl);
    if (!key) return Promise.resolve();
    return this.delete(key);
  }

  async getSignedDownloadUrlByPath(pathOrUrl: string) {
    const key = parseUploadPath(pathOrUrl);
    if (!key) throw new BadRequestException('Ruta de archivo inválida');
    return this.getSignedDownloadUrl(key);
  }

  getSignedDownloadUrl(key: string) {
    return this.adapter.getSignedDownloadUrl(key, this.signedUrlTtl);
  }

  exists(key: string) {
    return this.adapter.exists(key);
  }

  async assertExistsByPath(pathOrUrl: string) {
    const key = parseUploadPath(pathOrUrl);
    if (!key) throw new BadRequestException('Ruta de archivo inválida');
    const found = await this.exists(key);
    if (!found) throw new NotFoundException('Archivo no encontrado');
    return key;
  }

  toPublicPath(key: string) {
    return buildUploadPath(key);
  }
}
