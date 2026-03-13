"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummariesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const summary_schema_1 = require("./schemas/summary.schema");
let SummariesService = class SummariesService {
    constructor(summaryModel) {
        this.summaryModel = summaryModel;
    }
    async create(createSummaryDto) {
        if (!mongoose_2.Types.ObjectId.isValid(createSummaryDto.meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        if (!mongoose_2.Types.ObjectId.isValid(createSummaryDto.transcriptId)) {
            throw new common_1.BadRequestException('Invalid transcriptId format');
        }
        const summary = new this.summaryModel({
            meetingId: new mongoose_2.Types.ObjectId(createSummaryDto.meetingId),
            transcriptId: new mongoose_2.Types.ObjectId(createSummaryDto.transcriptId),
            summary: createSummaryDto.summary,
            keyPoints: createSummaryDto.keyPoints || [],
            actionItems: createSummaryDto.actionItems || [],
            decisions: createSummaryDto.decisions || [],
            topics: createSummaryDto.topics || [],
            sentiment: createSummaryDto.sentiment,
            aiProvider: createSummaryDto.aiProvider || 'auto',
            modelUsed: createSummaryDto.modelUsed,
            processingTimeMs: createSummaryDto.processingTimeMs,
        });
        return summary.save();
    }
    async findAll() {
        return this.summaryModel.find().exec();
    }
    async findByMeetingId(meetingId) {
        if (!mongoose_2.Types.ObjectId.isValid(meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        return this.summaryModel.find({ meetingId: new mongoose_2.Types.ObjectId(meetingId) }).exec();
    }
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid summary ID format');
        }
        const summary = await this.summaryModel.findById(id).exec();
        if (!summary) {
            throw new common_1.NotFoundException(`Summary with ID ${id} not found`);
        }
        return summary;
    }
    async update(id, updateSummaryDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid summary ID format');
        }
        const updateData = { ...updateSummaryDto };
        if (updateSummaryDto.meetingId && !mongoose_2.Types.ObjectId.isValid(updateSummaryDto.meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        if (updateSummaryDto.transcriptId && !mongoose_2.Types.ObjectId.isValid(updateSummaryDto.transcriptId)) {
            throw new common_1.BadRequestException('Invalid transcriptId format');
        }
        if (updateSummaryDto.meetingId) {
            updateData.meetingId = new mongoose_2.Types.ObjectId(updateSummaryDto.meetingId);
        }
        if (updateSummaryDto.transcriptId) {
            updateData.transcriptId = new mongoose_2.Types.ObjectId(updateSummaryDto.transcriptId);
        }
        const summary = await this.summaryModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!summary) {
            throw new common_1.NotFoundException(`Summary with ID ${id} not found`);
        }
        return summary;
    }
    async toggleActionItem(id, updateActionItemDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid summary ID format');
        }
        const summary = await this.summaryModel.findById(id).exec();
        if (!summary) {
            throw new common_1.NotFoundException(`Summary with ID ${id} not found`);
        }
        const { actionItemIndex, completed } = updateActionItemDto;
        if (actionItemIndex < 0 || actionItemIndex >= summary.actionItems.length) {
            throw new common_1.BadRequestException(`Invalid actionItemIndex: ${actionItemIndex}. Summary has ${summary.actionItems.length} action items.`);
        }
        summary.actionItems[actionItemIndex].completed = completed;
        return summary.save();
    }
    async delete(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid summary ID format');
        }
        const result = await this.summaryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException(`Summary with ID ${id} not found`);
        }
    }
};
exports.SummariesService = SummariesService;
exports.SummariesService = SummariesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(summary_schema_1.Summary.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SummariesService);
//# sourceMappingURL=summaries.service.js.map