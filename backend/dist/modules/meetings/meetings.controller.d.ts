import { Request, Response } from 'express';
import { MeetingsService } from './meetings.service';
import { MeetingSyncService } from './meetings-sync.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { MeetingStatus } from './schemas/meeting.schema';
export declare class MeetingsController {
    private readonly meetingsService;
    private readonly meetingSyncService;
    private readonly logger;
    constructor(meetingsService: MeetingsService, meetingSyncService: MeetingSyncService);
    syncMeetings(): Promise<{
        synced: number;
        message: string;
    }>;
    getSyncStatus(): Promise<{
        authenticated: boolean;
        message: string;
    }>;
    getStats(): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        processing: number;
    }>;
    handleWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(createMeetingDto: CreateMeetingDto): Promise<import("./schemas/meeting.schema").MeetingDocument>;
    findAll(query: QueryMeetingsDto): Promise<{
        data: import("./schemas/meeting.schema").MeetingDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./schemas/meeting.schema").MeetingDocument>;
    update(id: string, updateMeetingDto: UpdateMeetingDto): Promise<import("./schemas/meeting.schema").MeetingDocument>;
    processMeeting(id: string): Promise<import("./schemas/meeting.schema").MeetingDocument>;
    getStatus(id: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        status: MeetingStatus;
        subject: string;
        transcriptId: import("mongoose").Types.ObjectId;
        summaryId: import("mongoose").Types.ObjectId;
        errorMessage: string | null;
    }>;
}
