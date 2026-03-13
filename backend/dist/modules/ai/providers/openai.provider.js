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
exports.OpenAiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let OpenAiProvider = class OpenAiProvider {
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('ai.openai.apiKey');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        this.client = new openai_1.default({ apiKey });
        this.model = this.configService.get('ai.openai.model') || 'gpt-4-turbo-preview';
    }
    async analyzeTranscript(transcript, meetingTopic) {
        const systemPrompt = `You are an expert meeting analyst. Analyze the provided meeting transcript and extract:
1. A concise summary of the meeting
2. Key discussion points
3. Action items (if any)
4. Decisions made

Return the response as valid JSON with this exact structure:
{
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": [
    {
      "assignee": "string",
      "task": "string",
      "deadline": "ISO date string or null",
      "priority": "high|medium|low"
    }
  ],
  "decisions": ["string"]
}

Only return valid JSON, no additional text.`;
        const userPrompt = `Please analyze this meeting transcript:\n\n${transcript}`;
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: this.configService.get('ai.openai.temperature') || 0.7,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from OpenAI API');
            }
            const analysis = JSON.parse(content);
            this.validateAnalysis(analysis);
            return analysis;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse OpenAI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }
    async summarize(text) {
        const systemPrompt = 'You are an expert at creating concise, clear summaries of meeting content.';
        const userPrompt = `Summarize the following text in 3-5 sentences, focusing on key decisions and action items:\n\n${text}`;
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: this.configService.get('ai.openai.temperature') || 0.7,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from OpenAI API while summarizing');
        }
        return content.trim();
    }
    validateAnalysis(analysis) {
        if (!analysis.summary || typeof analysis.summary !== 'string') {
            throw new Error('Invalid analysis: summary is required and must be a string');
        }
        if (!Array.isArray(analysis.keyPoints)) {
            throw new Error('Invalid analysis: keyPoints must be an array');
        }
        if (!Array.isArray(analysis.actionItems)) {
            throw new Error('Invalid analysis: actionItems must be an array');
        }
        if (!Array.isArray(analysis.decisions)) {
            throw new Error('Invalid analysis: decisions must be an array');
        }
    }
};
exports.OpenAiProvider = OpenAiProvider;
exports.OpenAiProvider = OpenAiProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiProvider);
//# sourceMappingURL=openai.provider.js.map