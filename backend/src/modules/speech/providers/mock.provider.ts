import { Injectable } from '@nestjs/common';
import {
  SpeechProvider,
  TranscriptionResult,
  TranscriptionOptions,
  TranscriptionSegment,
} from '../../../common/interfaces';

/**
 * Mock Speech-to-Text Provider for development and testing.
 * Returns realistic mock transcript data with a 1-second delay.
 */
@Injectable()
export class MockSpeechProvider implements SpeechProvider {
  async transcribe(
    audioBuffer: Buffer,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock segments with realistic timing (seconds)
    const mockSegments: TranscriptionSegment[] = [
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
}
