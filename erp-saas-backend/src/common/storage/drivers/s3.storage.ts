import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageDriverAdapter, StoredObject } from '../storage.types';
import { buildUploadPath } from '../storage.utils';

@Injectable()
export class S3StorageDriver implements StorageDriverAdapter {
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly accessKeyId?: string;
  private readonly secretAccessKey?: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('S3_REGION', 'eu-west-1');
    this.endpoint = this.config.get<string>('S3_ENDPOINT') || undefined;
    this.accessKeyId = this.config.get<string>('S3_ACCESS_KEY') || undefined;
    this.secretAccessKey = this.config.get<string>('S3_SECRET_KEY') || undefined;
    this.bucket = this.config.get<string>('S3_BUCKET', '');
    this.prefix = this.config.get<string>('S3_PREFIX', 'uploads').replace(/^\/|\/$/g, '');
  }

  private getClient() {
    if (!this.bucket) {
      throw new InternalServerErrorException('S3_BUCKET es obligatorio con STORAGE_DRIVER=s3');
    }
    if (!this.client) {
      this.client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        forcePathStyle: !!this.endpoint,
        credentials:
          this.accessKeyId && this.secretAccessKey
            ? { accessKeyId: this.accessKeyId, secretAccessKey: this.secretAccessKey }
            : undefined,
      });
    }
    return this.client;
  }

  private objectKey(key: string) {
    return this.prefix ? `${this.prefix}/${key}` : key;
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<StoredObject> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(key),
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key, url: buildUploadPath(key) };
  }

  async delete(key: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(key),
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(key),
    });
    return getSignedUrl(this.getClient(), command, { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getClient().send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.objectKey(key),
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
