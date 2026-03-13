"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const interfaces_1 = require("../../common/interfaces");
const openai_provider_1 = require("./providers/openai.provider");
const anthropic_provider_1 = require("./providers/anthropic.provider");
const mock_provider_1 = require("./providers/mock.provider");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: interfaces_1.AI_PROVIDER,
                useFactory: (configService) => {
                    const provider = configService.get('ai.provider', 'mock').toLowerCase();
                    switch (provider) {
                        case 'openai':
                            return new openai_provider_1.OpenAiProvider(configService);
                        case 'anthropic':
                            return new anthropic_provider_1.AnthropicProvider(configService);
                        case 'mock':
                            return new mock_provider_1.MockProvider();
                        default:
                            throw new Error(`Unknown AI provider: ${provider}`);
                    }
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [interfaces_1.AI_PROVIDER],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map