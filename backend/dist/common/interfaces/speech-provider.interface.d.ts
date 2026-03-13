export interface TranscriptionResult {
    text: string;
    segments: TranscriptionSegment[];
    language?: string;
    duration?: number;
}
export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence?: number;
}
export interface SpeechProvider {
    transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
}
export interface TranscriptionOptions {
    language?: string;
    prompt?: string;
    format?: 'text' | 'verbose_json' | 'srt' | 'vtt';
}
export declare const SPEECH_PROVIDER = "SPEECH_PROVIDER";
