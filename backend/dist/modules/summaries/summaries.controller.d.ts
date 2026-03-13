import { SummariesService } from './summaries.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { SummaryDocument } from './schemas/summary.schema';
export declare class SummariesController {
    private readonly summariesService;
    constructor(summariesService: SummariesService);
    create(createSummaryDto: CreateSummaryDto): Promise<SummaryDocument>;
    findAll(): Promise<SummaryDocument[]>;
    findByMeetingId(meetingId: string): Promise<SummaryDocument[]>;
    findOne(id: string): Promise<SummaryDocument>;
    toggleActionItem(id: string, updateActionItemDto: UpdateActionItemDto): Promise<SummaryDocument>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
