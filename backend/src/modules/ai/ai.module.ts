import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER, AiProvider } from '../../common/interfaces';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MockProvider } from './providers/mock.provider';

/**
 * AI Module provides pluggable abstraction for different LLM providers.
 * The provider is dynamically loaded based on AI_PROVIDER config.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_PROVIDER,
      useFactory: (configService: ConfigService): AiProvider => {
        const provider = configService.get<string>('ai.provider', 'mock').toLowerCase();

        switch (provider) {
          case 'openai':
            return new OpenAiProvider(configService);
          case 'anthropic':
            return new AnthropicProvider(configService);
          case 'mock':
            return new MockProvider();
          default:
            throw new Error(`Unknown AI provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
