"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const interfaces_1 = require("../../common/interfaces");
const local_provider_1 = require("./providers/local.provider");
const s3_provider_1 = require("./providers/s3.provider");
const azure_blob_provider_1 = require("./providers/azure-blob.provider");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: interfaces_1.STORAGE_PROVIDER,
                useFactory: (configService) => {
                    const provider = configService.get('storage.provider', 'local').toLowerCase();
                    switch (provider) {
                        case 'local':
                            return new local_provider_1.LocalStorageProvider(configService);
                        case 's3':
                            return new s3_provider_1.S3StorageProvider(configService);
                        case 'azure-blob':
                        case 'azure':
                            return new azure_blob_provider_1.AzureBlobStorageProvider(configService);
                        default:
                            throw new Error(`Unknown storage provider: ${provider}`);
                    }
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [interfaces_1.STORAGE_PROVIDER],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map