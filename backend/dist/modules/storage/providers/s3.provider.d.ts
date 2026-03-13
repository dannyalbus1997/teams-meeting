import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { StorageProvider } from '../../../common/interfaces';
export declare class S3StorageProvider implements StorageProvider {
    private configService;
    constructor(configService: ConfigService);
    upload(key: string, data: Buffer | Readable, contentType?: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
    exists(key: string): Promise<boolean>;
    listFiles(prefix?: string): Promise<string[]>;
}
