import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink, access } from 'fs/promises';
import { join } from 'path';
import type { StorageDriverAdapter, StoredObject } from '../storage.types';
import { buildUploadPath } from '../storage.utils';

@Injectable()
export class LocalStorageDriver implements StorageDriverAdapter {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
  }

  private ensureDir() {
    if (!existsSync(this.uploadDir)) mkdirSync(this.uploadDir, { recursive: true });
  }

  async upload(buffer: Buffer, key: string, _contentType: string): Promise<StoredObject> {
    this.ensureDir();
    await writeFile(join(this.uploadDir, key), buffer);
    return { key, url: buildUploadPath(key) };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, key));
    } catch {
      // ignore missing files
    }
  }

  async getSignedDownloadUrl(key: string, _expiresInSeconds: number): Promise<string> {
    return buildUploadPath(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.uploadDir, key));
      return true;
    } catch {
      return false;
    }
  }
}
