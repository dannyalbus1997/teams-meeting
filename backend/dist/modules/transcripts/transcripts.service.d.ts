import { Model } from 'mongoose';
import { TranscriptDocument } from './schemas/transcript.schema';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
export declare class TranscriptsService {
    private transcriptModel;
    constructor(transcriptModel: Model<TranscriptDocument>);
    create(createTranscriptDto: CreateTranscriptDto): Promise<TranscriptDocument>;
    findAll(): Promise<TranscriptDocument[]>;
    findByMeetingId(meetingId: string): Promise<TranscriptDocument[]>;
    findOne(id: string): Promise<TranscriptDocument>;
    update(id: string, updateTranscriptDto: Partial<CreateTranscriptDto>): Promise<TranscriptDocument>;
    delete(id: string): Promise<void>;
}
