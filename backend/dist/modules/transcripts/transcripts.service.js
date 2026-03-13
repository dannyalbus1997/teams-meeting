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
exports.TranscriptsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transcript_schema_1 = require("./schemas/transcript.schema");
let TranscriptsService = class TranscriptsService {
    constructor(transcriptModel) {
        this.transcriptModel = transcriptModel;
    }
    async create(createTranscriptDto) {
        if (!mongoose_2.Types.ObjectId.isValid(createTranscriptDto.meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        const wordCount = createTranscriptDto.fullText
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
        const transcript = new this.transcriptModel({
            meetingId: new mongoose_2.Types.ObjectId(createTranscriptDto.meetingId),
            fullText: createTranscriptDto.fullText,
            segments: createTranscriptDto.segments,
            language: createTranscriptDto.language,
            duration: createTranscriptDto.duration,
            source: createTranscriptDto.source || 'manual',
            wordCount,
        });
        return transcript.save();
    }
    async findAll() {
        return this.transcriptModel.find().exec();
    }
    async findByMeetingId(meetingId) {
        if (!mongoose_2.Types.ObjectId.isValid(meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        return this.transcriptModel.find({ meetingId: new mongoose_2.Types.ObjectId(meetingId) }).exec();
    }
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transcript ID format');
        }
        const transcript = await this.transcriptModel.findById(id).exec();
        if (!transcript) {
            throw new common_1.NotFoundException(`Transcript with ID ${id} not found`);
        }
        return transcript;
    }
    async update(id, updateTranscriptDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transcript ID format');
        }
        const updateData = { ...updateTranscriptDto };
        if (updateTranscriptDto.fullText) {
            updateData.wordCount = updateTranscriptDto.fullText
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0).length;
        }
        if (updateTranscriptDto.meetingId && !mongoose_2.Types.ObjectId.isValid(updateTranscriptDto.meetingId)) {
            throw new common_1.BadRequestException('Invalid meetingId format');
        }
        if (updateTranscriptDto.meetingId) {
            updateData.meetingId = new mongoose_2.Types.ObjectId(updateTranscriptDto.meetingId);
        }
        const transcript = await this.transcriptModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!transcript) {
            throw new common_1.NotFoundException(`Transcript with ID ${id} not found`);
        }
        return transcript;
    }
    async delete(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transcript ID format');
        }
        const result = await this.transcriptModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException(`Transcript with ID ${id} not found`);
        }
    }
};
exports.TranscriptsService = TranscriptsService;
exports.TranscriptsService = TranscriptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transcript_schema_1.Transcript.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TranscriptsService);
//# sourceMappingURL=transcripts.service.js.map