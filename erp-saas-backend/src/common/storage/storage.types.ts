export type StorageDriver = 'local' | 's3';

export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageDriverAdapter {
  upload(buffer: Buffer, key: string, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}
