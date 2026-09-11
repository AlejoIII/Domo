import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageDriver } from './drivers/local.storage';
import { S3StorageDriver } from './drivers/s3.storage';

@Global()
@Module({
  providers: [LocalStorageDriver, S3StorageDriver, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
