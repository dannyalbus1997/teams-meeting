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
exports.S3StorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let S3StorageProvider = class S3StorageProvider {
    constructor(configService) {
        this.configService = configService;
        const bucket = this.configService.get('storage.s3.bucket');
        if (!bucket) {
            throw new Error('S3 storage provider is not fully configured. ' +
                'Please set AWS_S3_BUCKET and other required AWS credentials.');
        }
    }
    async upload(key, data, contentType) {
        throw new Error('S3 storage provider is not fully implemented');
    }
    async download(key) {
        throw new Error('S3 storage provider is not fully implemented');
    }
    async delete(key) {
        throw new Error('S3 storage provider is not fully implemented');
    }
    async getSignedUrl(key, expiresInSeconds) {
        throw new Error('S3 storage provider is not fully implemented');
    }
    async exists(key) {
        throw new Error('S3 storage provider is not fully implemented');
    }
    async listFiles(prefix) {
        throw new Error('S3 storage provider is not fully implemented');
    }
};
exports.S3StorageProvider = S3StorageProvider;
exports.S3StorageProvider = S3StorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageProvider);
//# sourceMappingURL=s3.provider.js.map