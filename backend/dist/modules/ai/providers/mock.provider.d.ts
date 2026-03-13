import { AiProvider, MeetingAnalysis } from '../../../common/interfaces';
export declare class MockProvider implements AiProvider {
    analyzeTranscript(transcript: string, meetingTopic?: string): Promise<MeetingAnalysis>;
    summarize(text: string): Promise<string>;
}
