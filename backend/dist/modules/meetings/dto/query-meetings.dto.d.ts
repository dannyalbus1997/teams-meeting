import { MeetingStatus } from '../schemas/meeting.schema';
export declare class QueryMeetingsDto {
    status?: MeetingStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
