import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GraphService } from '../graph/graph.service';
import { MeetingsService } from './meetings.service';
import { MeetingDocument } from './schemas/meeting.schema';
export declare class MeetingSyncService {
    private meetingModel;
    private graphService;
    private meetingsService;
    private configService;
    private readonly logger;
    private accessToken;
    private tokenExpiresAt;
    constructor(meetingModel: Model<MeetingDocument>, graphService: GraphService, meetingsService: MeetingsService, configService: ConfigService);
    setAccessToken(token: string, expiresAt: Date): void;
    getIsAuthenticated(): boolean;
    syncMeetings(): Promise<void>;
    private processCalendarEvent;
    private tryFetchTranscript;
    syncNow(): Promise<{
        synced: number;
        message: string;
    }>;
}
