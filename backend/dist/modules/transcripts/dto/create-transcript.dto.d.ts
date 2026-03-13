export declare class TranscriptSegmentDto {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence?: number;
}
export declare class CreateTranscriptDto {
    meetingId: string;
    fullText: string;
    segments: TranscriptSegmentDto[];
    language?: string;
    duration?: number;
    source?: string;
}
