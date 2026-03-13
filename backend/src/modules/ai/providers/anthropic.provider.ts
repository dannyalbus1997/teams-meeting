import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiProvider, MeetingAnalysis } from '../../../common/interfaces';

@Injectable()
export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.anthropic.apiKey');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.client = new Anthropic({ apiKey });
    this.model = this.configService.get<string>('ai.anthropic.model') || 'claude-3-opus-20240229';
  }

  async analyzeTranscript(transcript: string, meetingTopic?: string): Promise<MeetingAnalysis> {
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

      const analysis = JSON.parse(content.text) as MeetingAnalysis;
      this.validateAnalysis(analysis);
      return analysis;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse Anthropic response as JSON: ${error.message}`);
      }
      throw error;
    }
  }

  async summarize(text: string): Promise<string> {
    const systemPrompt =
      'You are an expert at creating concise, clear summaries of meeting content.';
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

  private validateAnalysis(analysis: MeetingAnalysis): void {
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
}
