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
exports.AnthropicProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@anthropic-ai/sdk");
let AnthropicProvider = class AnthropicProvider {
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('ai.anthropic.apiKey');
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }
        this.client = new sdk_1.default({ apiKey });
        this.model = this.configService.get('ai.anthropic.model') || 'claude-3-opus-20240229';
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
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt },
                ],
            });
            const content = message.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Anthropic API');
            }
            const analysis = JSON.parse(content.text);
            this.validateAnalysis(analysis);
            return analysis;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse Anthropic response as JSON: ${error.message}`);
            }
            throw error;
        }
    }
    async summarize(text) {
        const systemPrompt = 'You are an expert at creating concise, clear summaries of meeting content.';
        const userPrompt = `Summarize the following text in 3-5 sentences, focusing on key decisions and action items:\n\n${text}`;
        const message = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });
        const content = message.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic API while summarizing');
        }
        return content.text.trim();
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
exports.AnthropicProvider = AnthropicProvider;
exports.AnthropicProvider = AnthropicProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AnthropicProvider);
//# sourceMappingURL=anthropic.provider.js.map