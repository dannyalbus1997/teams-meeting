import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { MeetingDocument, MeetingStatus } from './schemas/meeting.schema';
import { SpeechProvider, AiProvider, StorageProvider } from '../../common/interfaces';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { SummariesService } from '../summaries/summaries.service';
export declare class MeetingsService {
    private meetingModel;
    private speechProvider;
    private aiProvider;
    private storageProvider;
    private transcriptsService;
    private summariesService;
    private readonly logger;
    constructor(meetingModel: Model<MeetingDocument>, speechProvider: SpeechProvider, aiProvider: AiProvider, storageProvider: StorageProvider, transcriptsService: TranscriptsService, summariesService: SummariesService);
    create(createMeetingDto: CreateMeetingDto): Promise<MeetingDocument>;
    findAll(query: QueryMeetingsDto): Promise<{
        data: MeetingDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<MeetingDocument>;
    findByTeamsEventId(teamsEventId: string): Promise<MeetingDocument | null>;
    update(id: string, updateMeetingDto: UpdateMeetingDto): Promise<MeetingDocument>;
    updateStatus(id: string, status: MeetingStatus, errorMessage?: string): Promise<MeetingDocument>;
    processWithTranscriptText(id: string, fullText: string, segments: Array<{
        start: number;
        end: number;
        text: string;
        speaker?: string;
    }>, source?: string): Promise<MeetingDocument>;
    processWithRecording(id: string, audioBuffer: Buffer): Promise<MeetingDocument>;
    processMeeting(id: string): Promise<MeetingDocument>;
    getStats(): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        processing: number;
    }>;
}
