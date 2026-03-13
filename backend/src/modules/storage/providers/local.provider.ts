import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { StorageProvider } from '../../../common/interfaces';

/**
 * Local file system storage provider.
 * Stores files in a configurable directory on the local machine.
 * Creates directories as needed.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(private configService: ConfigService) {
    this.basePath = this.configService.get<string>(
      'storage.local.path',
      './uploads',
    );

    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(key: string, data: Buffer | Readable, contentType?: string): Promise<string> {
    const filePath = this.getFilePath(key);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Handle both Buffer and Stream
    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(filePath, data);
    } else {
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        data.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
    }

    return filePath;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }

    return fs.promises.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }

    await fs.promises.unlink(filePath);

    // Clean up empty directories
    const dirPath = path.dirname(filePath);
    await this.removeEmptyDirs(dirPath);
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }

    // Return a file:// URL for local storage
    return `file://${path.resolve(filePath)}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;

    if (!fs.existsSync(searchPath)) {
      return [];
    }

    const files: string[] = [];
    this.walkDir(searchPath, files);

    // Return keys relative to basePath
    return files.map(file => path.relative(this.basePath, file));
  }

  private getFilePath(key: string): string {
    // Prevent directory traversal attacks
    const normalizedKey = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
    return path.join(this.basePath, normalizedKey);
  }

  private walkDir(dir: string, files: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walkDir(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
  }

  private async removeEmptyDirs(dir: string): Promise<void> {
    try {
      if (dir.startsWith(this.basePath) && dir !== this.basePath) {
        const entries = await fs.promises.readdir(dir);
        if (entries.length === 0) {
          await fs.promises.rmdir(dir);
          await this.removeEmptyDirs(path.dirname(dir));
        }
      }
    } catch (error) {
      // Ignore errors, might be in use or already deleted
    }
  }
}
