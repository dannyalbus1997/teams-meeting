import { TranscriptsService } from './transcripts.service';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { TranscriptDocument } from './schemas/transcript.schema';
export declare class TranscriptsController {
    private readonly transcriptsService;
    constructor(transcriptsService: TranscriptsService);
    create(createTranscriptDto: CreateTranscriptDto): Promise<TranscriptDocument>;
    findAll(): Promise<TranscriptDocument[]>;
    findByMeetingId(meetingId: string): Promise<TranscriptDocument[]>;
    findOne(id: string): Promise<TranscriptDocument>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
