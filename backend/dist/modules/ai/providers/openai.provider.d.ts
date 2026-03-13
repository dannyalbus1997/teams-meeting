import { ConfigService } from '@nestjs/config';
import { AiProvider, MeetingAnalysis } from '../../../common/interfaces';
export declare class OpenAiProvider implements AiProvider {
    private configService;
    private client;
    private model;
    constructor(configService: ConfigService);
    analyzeTranscript(transcript: string, meetingTopic?: string): Promise<MeetingAnalysis>;
    summarize(text: string): Promise<string>;
    private validateAnalysis;
}
