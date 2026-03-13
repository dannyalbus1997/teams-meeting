import { SpeechProvider, TranscriptionResult, TranscriptionOptions } from '../../../common/interfaces';
export declare class MockSpeechProvider implements SpeechProvider {
    transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
}
