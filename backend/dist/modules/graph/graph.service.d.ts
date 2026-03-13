import { ConfigService } from '@nestjs/config';
export interface CalendarEvent {
    id: string;
    subject: string;
    start: Date;
    end: Date;
    organizer?: {
        displayName: string;
        emailAddress: string;
    };
    attendees?: Array<{
        displayName: string;
        emailAddress: string;
    }>;
    isOnlineMeeting: boolean;
    onlineMeetingUrl?: string;
    onlineMeetingId?: string;
}
export interface GraphUserProfile {
    id: string;
    displayName: string;
    mail: string;
    mobilePhone?: string;
    jobTitle?: string;
}
export interface OnlineMeetingTranscript {
    id: string;
    content: string;
    contentType: string;
    createdDateTime: string;
}
export interface CallRecord {
    id: string;
    type: string;
    startDateTime: string;
    endDateTime: string;
    joinWebUrl: string;
    organizer?: {
        user?: {
            id: string;
            displayName: string;
        };
    };
    participants?: Array<{
        user?: {
            id: string;
            displayName: string;
        };
    }>;
}
export declare class GraphService {
    private configService;
    private readonly logger;
    private axiosClient;
    private betaClient;
    constructor(configService: ConfigService);
    private getAuthHeaders;
    getCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
    getOnlineMeetingByJoinUrl(accessToken: string, joinWebUrl: string): Promise<{
        meetingId: string;
        subject: string;
    } | null>;
    listMeetingTranscripts(accessToken: string, onlineMeetingId: string): Promise<{
        id: string;
        createdDateTime: string;
    }[]>;
    getTranscriptContent(accessToken: string, onlineMeetingId: string, transcriptId: string, format?: 'text/vtt' | 'text/plain'): Promise<string>;
    listMeetingRecordings(accessToken: string, onlineMeetingId: string): Promise<{
        id: string;
        createdDateTime: string;
    }[]>;
    getRecordingContent(accessToken: string, onlineMeetingId: string, recordingId: string): Promise<Buffer>;
    getRecentCallRecords(accessToken: string, fromDate: Date): Promise<CallRecord[]>;
    createSubscription(accessToken: string, resource: string, notificationUrl: string, changeType?: string, expirationMinutes?: number): Promise<any>;
    renewSubscription(accessToken: string, subscriptionId: string, expirationMinutes?: number): Promise<any>;
    getUserProfile(accessToken: string): Promise<GraphUserProfile>;
    parseVttTranscript(vttContent: string): {
        fullText: string;
        segments: Array<{
            start: number;
            end: number;
            text: string;
            speaker?: string;
        }>;
    };
    private vttTimeToSeconds;
    private handleGraphError;
}
