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
exports.WhisperApiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const form_data_1 = require("form-data");
let WhisperApiProvider = class WhisperApiProvider {
    constructor(configService) {
        this.configService = configService;
        this.apiEndpoint = this.configService.get('speech.whisper.apiEndpoint', 'http://localhost:8000/transcribe');
        const timeout = this.configService.get('speech.whisper.timeout', 30000);
        this.client = axios_1.default.create({
            timeout,
            headers: {
                'User-Agent': 'teams-meeting-summarizer/1.0',
            },
        });
    }
    async transcribe(audioBuffer, options) {
        try {
            const formData = new form_data_1.default();
            formData.append('file', audioBuffer, {
                filename: 'audio.wav',
                contentType: 'audio/wav',
            });
            if (options?.language) {
                formData.append('language', options.language);
            }
            if (options?.prompt) {
                formData.append('prompt', options.prompt);
            }
            formData.append('response_format', 'verbose_json');
            const response = await this.client.post(this.apiEndpoint, formData, {
                headers: formData.getHeaders(),
            });
            if (!response.data) {
                throw new Error('Empty response from Whisper API');
            }
            return this.parseWhisperResponse(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new common_1.HttpException(`Whisper API error: ${error.message}`, error.response?.status || common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw error;
        }
    }
    parseWhisperResponse(data) {
        if (!data.text) {
            throw new Error('Invalid Whisper API response: missing text field');
        }
        const segments = (data.segments || []).map((segment) => ({
            text: segment.text || '',
            start: typeof segment.start === 'number' ? segment.start : 0,
            end: typeof segment.end === 'number' ? segment.end : 0,
            speaker: segment.speaker || undefined,
            confidence: segment.no_speech_prob !== undefined
                ? 1 - segment.no_speech_prob
                : undefined,
        }));
        let totalDuration = 0;
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            totalDuration = lastSegment.end;
        }
        return {
            text: data.text.trim(),
            segments,
            language: data.language || 'en',
            duration: totalDuration,
        };
    }
};
exports.WhisperApiProvider = WhisperApiProvider;
exports.WhisperApiProvider = WhisperApiProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhisperApiProvider);
//# sourceMappingURL=whisper-api.provider.js.map