import { Model } from 'mongoose';
import { SummaryDocument } from './schemas/summary.schema';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
export declare class SummariesService {
    private summaryModel;
    constructor(summaryModel: Model<SummaryDocument>);
    create(createSummaryDto: CreateSummaryDto): Promise<SummaryDocument>;
    findAll(): Promise<SummaryDocument[]>;
    findByMeetingId(meetingId: string): Promise<SummaryDocument[]>;
    findOne(id: string): Promise<SummaryDocument>;
    update(id: string, updateSummaryDto: Partial<CreateSummaryDto>): Promise<SummaryDocument>;
    toggleActionItem(id: string, updateActionItemDto: UpdateActionItemDto): Promise<SummaryDocument>;
    delete(id: string): Promise<void>;
}
