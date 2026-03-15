import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProvider, MeetingAnalysis } from '../../../common/interfaces';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openai.apiKey');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('ai.openai.model') || 'gpt-4-turbo-preview';
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
      // Try with response_format first, fall back without it for models that don't support it
      let content: string | null = null;

      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.configService.get<number>('ai.openai.temperature') || 0.7,
          response_format: { type: 'json_object' },
        });
        content = response.choices[0]?.message?.content;
      } catch (formatError: any) {
        // If response_format isn't supported, retry without it
        if (formatError?.message?.includes('response_format') || formatError?.status === 400) {
          const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: this.configService.get<number>('ai.openai.temperature') || 0.7,
          });
          content = response.choices[0]?.message?.content;
        } else {
          throw formatError;
        }
      }

      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const analysis = JSON.parse(jsonStr) as MeetingAnalysis;
      this.validateAnalysis(analysis);
      return analysis;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${error.message}`);
      }
      throw error;
    }
  }

  async summarize(text: string): Promise<string> {
    const systemPrompt =
      'You are an expert at creating concise, clear summaries of meeting content.';
    const userPrompt = `Summarize the following text in 3-5 sentences, focusing on key decisions and action items:\n\n${text}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: this.configService.get<number>('ai.openai.temperature') || 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API while summarizing');
    }

    return content.trim();
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
