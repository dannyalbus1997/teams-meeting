"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
let LocalStorageProvider = class LocalStorageProvider {
    constructor(configService) {
        this.configService = configService;
        this.basePath = this.configService.get('storage.local.path', './uploads');
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    async upload(key, data, contentType) {
        const filePath = this.getFilePath(key);
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        if (Buffer.isBuffer(data)) {
            fs.writeFileSync(filePath, data);
        }
        else {
            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                data.pipe(writeStream);
                writeStream.on('finish', () => resolve());
                writeStream.on('error', reject);
            });
        }
        return filePath;
    }
    async download(key) {
        const filePath = this.getFilePath(key);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${key}`);
        }
        return fs.promises.readFile(filePath);
    }
    async delete(key) {
        const filePath = this.getFilePath(key);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${key}`);
        }
        await fs.promises.unlink(filePath);
        const dirPath = path.dirname(filePath);
        await this.removeEmptyDirs(dirPath);
    }
    async getSignedUrl(key, expiresInSeconds) {
        const filePath = this.getFilePath(key);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${key}`);
        }
        return `file://${path.resolve(filePath)}`;
    }
    async exists(key) {
        const filePath = this.getFilePath(key);
        return fs.existsSync(filePath);
    }
    async listFiles(prefix) {
        const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;
        if (!fs.existsSync(searchPath)) {
            return [];
        }
        const files = [];
        this.walkDir(searchPath, files);
        return files.map(file => path.relative(this.basePath, file));
    }
    getFilePath(key) {
        const normalizedKey = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
        return path.join(this.basePath, normalizedKey);
    }
    walkDir(dir, files) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                this.walkDir(fullPath, files);
            }
            else {
                files.push(fullPath);
            }
        }
    }
    async removeEmptyDirs(dir) {
        try {
            if (dir.startsWith(this.basePath) && dir !== this.basePath) {
                const entries = await fs.promises.readdir(dir);
                if (entries.length === 0) {
                    await fs.promises.rmdir(dir);
                    await this.removeEmptyDirs(path.dirname(dir));
                }
            }
        }
        catch (error) {
        }
    }
};
exports.LocalStorageProvider = LocalStorageProvider;
exports.LocalStorageProvider = LocalStorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageProvider);
//# sourceMappingURL=local.provider.js.map