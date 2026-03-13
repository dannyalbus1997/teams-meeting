import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER, StorageProvider } from '../../common/interfaces';
import { LocalStorageProvider } from './providers/local.provider';
import { S3StorageProvider } from './providers/s3.provider';
import { AzureBlobStorageProvider } from './providers/azure-blob.provider';

/**
 * Storage Module provides pluggable abstraction for different storage backends.
 * The provider is dynamically loaded based on STORAGE_PROVIDER config.
 *
 * Supported providers:
 * - local: File system storage (default, development-friendly)
 * - s3: AWS S3 (requires AWS credentials)
 * - azure-blob: Azure Blob Storage (requires Azure connection string)
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService): StorageProvider => {
        const provider = configService.get<string>('storage.provider', 'local').toLowerCase();

        switch (provider) {
          case 'local':
            return new LocalStorageProvider(configService);
          case 's3':
            return new S3StorageProvider(configService);
          case 'azure-blob':
          case 'azure':
            return new AzureBlobStorageProvider(configService);
          default:
            throw new Error(`Unknown storage provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
