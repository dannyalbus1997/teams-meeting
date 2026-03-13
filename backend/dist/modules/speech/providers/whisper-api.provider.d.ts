import { ConfigService } from '@nestjs/config';
import { SpeechProvider, TranscriptionResult, TranscriptionOptions } from '../../../common/interfaces';
export declare class WhisperApiProvider implements SpeechProvider {
    private configService;
    private client;
    private apiEndpoint;
    constructor(configService: ConfigService);
    transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    private parseWhisperResponse;
}
