import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import {
  SpeechProvider,
  TranscriptionResult,
  TranscriptionOptions,
  TranscriptionSegment,
} from '../../../common/interfaces';

/**
 * Whisper API Speech-to-Text Provider
 *
 * Transcribes audio files using a Whisper API endpoint.
 * Supports both OpenAI's Whisper API and compatible endpoints.
 */
@Injectable()
export class WhisperApiProvider implements SpeechProvider {
  private client: AxiosInstance;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiEndpoint = this.configService.get<string>(
      'speech.whisper.apiEndpoint',
      'http://localhost:8000/transcribe',
    );

    const timeout = this.configService.get<number>(
      'speech.whisper.timeout',
      30000,
    );

    this.client = axios.create({
      timeout,
      headers: {
        'User-Agent': 'teams-meeting-summarizer/1.0',
      },
    });
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
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

      // Request verbose JSON for segment information
      formData.append('response_format', 'verbose_json');

      const response = await this.client.post(this.apiEndpoint, formData, {
        headers: formData.getHeaders(),
      });

      if (!response.data) {
        throw new Error('Empty response from Whisper API');
      }

      return this.parseWhisperResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `Whisper API error: ${error.message}`,
          error.response?.status || HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }

  /**
   * Parse Whisper API response format
   * Expected format:
   * {
   *   "text": "full transcript",
   *   "segments": [
   *     {
   *       "id": 0,
   *       "seek": 0,
   *       "start": 0.0,
   *       "end": 5.5,
   *       "text": "segment text",
   *       "tokens": [...],
   *       "temperature": 0.0,
   *       "avg_logprob": -0.5,
   *       "compression_ratio": 1.2,
   *       "no_speech_prob": 0.001
   *     }
   *   ],
   *   "language": "en"
   * }
   */
  private parseWhisperResponse(data: any): TranscriptionResult {
    if (!data.text) {
      throw new Error('Invalid Whisper API response: missing text field');
    }

    const segments: TranscriptionSegment[] = (data.segments || []).map(
      (segment: any) => ({
        text: segment.text || '',
        start: typeof segment.start === 'number' ? segment.start : 0,
        end: typeof segment.end === 'number' ? segment.end : 0,
        speaker: segment.speaker || undefined,
        confidence:
          segment.no_speech_prob !== undefined
            ? 1 - segment.no_speech_prob
            : undefined,
      }),
    );

    // Calculate total duration from segments or use provided duration
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
}
