import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { StorageProvider } from '../../../common/interfaces';
export declare class LocalStorageProvider implements StorageProvider {
    private configService;
    private basePath;
    constructor(configService: ConfigService);
    upload(key: string, data: Buffer | Readable, contentType?: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
    exists(key: string): Promise<boolean>;
    listFiles(prefix?: string): Promise<string[]>;
    private getFilePath;
    private walkDir;
    private removeEmptyDirs;
}
