"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const interfaces_1 = require("../../common/interfaces");
const whisper_api_provider_1 = require("./providers/whisper-api.provider");
const mock_provider_1 = require("./providers/mock.provider");
let SpeechModule = class SpeechModule {
};
exports.SpeechModule = SpeechModule;
exports.SpeechModule = SpeechModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: interfaces_1.SPEECH_PROVIDER,
                useFactory: (configService) => {
                    const provider = configService.get('speech.provider', 'mock').toLowerCase();
                    switch (provider) {
                        case 'whisper':
                            return new whisper_api_provider_1.WhisperApiProvider(configService);
                        case 'mock':
                            return new mock_provider_1.MockSpeechProvider();
                        default:
                            throw new Error(`Unknown speech provider: ${provider}`);
                    }
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [interfaces_1.SPEECH_PROVIDER],
    })
], SpeechModule);
//# sourceMappingURL=speech.module.js.map