import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SPEECH_PROVIDER, SpeechProvider } from '../../common/interfaces';
import { WhisperApiProvider } from './providers/whisper-api.provider';
import { MockSpeechProvider } from './providers/mock.provider';

/**
 * Speech-to-Text Module provides pluggable abstraction for different STT providers.
 * The provider is dynamically loaded based on SPEECH_PROVIDER config.
 *
 * Supported providers:
 * - whisper: Whisper API (compatible with OpenAI's Whisper API and similar endpoints)
 * - mock: Mock provider for development (returns realistic test data)
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SPEECH_PROVIDER,
      useFactory: (configService: ConfigService): SpeechProvider => {
        const provider = configService.get<string>('speech.provider', 'mock').toLowerCase();

        switch (provider) {
          case 'whisper':
            return new WhisperApiProvider(configService);
          case 'mock':
            return new MockSpeechProvider();
          default:
            throw new Error(`Unknown speech provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [SPEECH_PROVIDER],
})
export class SpeechModule {}
