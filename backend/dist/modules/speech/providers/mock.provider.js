"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSpeechProvider = void 0;
const common_1 = require("@nestjs/common");
let MockSpeechProvider = class MockSpeechProvider {
    async transcribe(audioBuffer, options) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockSegments = [
            {
                text: 'Thank you everyone for joining today. Let me start by reviewing the agenda.',
                start: 0,
                end: 4.5,
                speaker: 'Speaker 1',
                confidence: 0.98,
            },
            {
                text: 'We have three main topics to cover: project updates, resource allocation, and timeline review.',
                start: 4.5,
                end: 10.2,
                speaker: 'Speaker 1',
                confidence: 0.97,
            },
            {
                text: 'First, let me discuss the project status. We are currently on track for our Q1 deliverables.',
                start: 10.2,
                end: 16.8,
                speaker: 'Speaker 2',
                confidence: 0.96,
            },
            {
                text: 'Development team has completed the core functionality. QA is currently running comprehensive tests.',
                start: 16.8,
                end: 23.1,
                speaker: 'Speaker 2',
                confidence: 0.95,
            },
            {
                text: 'We expect to wrap up testing by end of week and move to staging next week.',
                start: 23.1,
                end: 28.5,
                speaker: 'Speaker 2',
                confidence: 0.96,
            },
            {
                text: 'Great update. Now let us discuss resource allocation for the next sprint.',
                start: 28.5,
                end: 33.3,
                speaker: 'Speaker 1',
                confidence: 0.97,
            },
            {
                text: 'We need to allocate two senior developers to the payment integration task.',
                start: 33.3,
                end: 38.7,
                speaker: 'Speaker 3',
                confidence: 0.94,
            },
            {
                text: 'And one junior developer can assist with documentation and testing.',
                start: 38.7,
                end: 43.2,
                speaker: 'Speaker 3',
                confidence: 0.93,
            },
            {
                text: 'I agree with that allocation. Does everyone have any concerns or blockers?',
                start: 43.2,
                end: 48.6,
                speaker: 'Speaker 1',
                confidence: 0.98,
            },
            {
                text: 'No concerns from my end. Looking forward to the next sprint.',
                start: 48.6,
                end: 53.4,
                speaker: 'Speaker 2',
                confidence: 0.95,
            },
        ];
        const fullText = mockSegments.map(s => s.text).join(' ');
        const totalDuration = mockSegments[mockSegments.length - 1].end;
        return {
            text: fullText,
            segments: mockSegments,
            language: options?.language || 'en',
            duration: totalDuration,
        };
    }
};
exports.MockSpeechProvider = MockSpeechProvider;
exports.MockSpeechProvider = MockSpeechProvider = __decorate([
    (0, common_1.Injectable)()
], MockSpeechProvider);
//# sourceMappingURL=mock.provider.js.map