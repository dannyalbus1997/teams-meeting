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
var MeetingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const meeting_schema_1 = require("./schemas/meeting.schema");
const interfaces_1 = require("../../common/interfaces");
const transcripts_service_1 = require("../transcripts/transcripts.service");
const summaries_service_1 = require("../summaries/summaries.service");
let MeetingsService = MeetingsService_1 = class MeetingsService {
    constructor(meetingModel, speechProvider, aiProvider, storageProvider, transcriptsService, summariesService) {
        this.meetingModel = meetingModel;
        this.speechProvider = speechProvider;
        this.aiProvider = aiProvider;
        this.storageProvider = storageProvider;
        this.transcriptsService = transcriptsService;
        this.summariesService = summariesService;
        this.logger = new common_1.Logger(MeetingsService_1.name);
    }
    async create(createMeetingDto) {
        try {
            const existingMeeting = await this.meetingModel.findOne({
                teamsEventId: createMeetingDto.teamsEventId,
            });
            if (existingMeeting) {
                return existingMeeting;
            }
            const meeting = new this.meetingModel(createMeetingDto);
            meeting.status = meeting_schema_1.MeetingStatus.DETECTED;
            return await meeting.save();
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to create meeting: ${error.message}`);
        }
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.startDate || query.endDate) {
            filter.startTime = {};
            if (query.startDate)
                filter.startTime.$gte = new Date(query.startDate);
            if (query.endDate)
                filter.startTime.$lte = new Date(query.endDate);
        }
        const [data, total] = await Promise.all([
            this.meetingModel.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit).exec(),
            this.meetingModel.countDocuments(filter),
        ]);
        return { data, total, page, limit };
    }
    async findOne(id) {
        const meeting = await this.meetingModel.findById(id).exec();
        if (!meeting)
            throw new common_1.NotFoundException(`Meeting with ID ${id} not found`);
        return meeting;
    }
    async findByTeamsEventId(teamsEventId) {
        return this.meetingModel.findOne({ teamsEventId }).exec();
    }
    async update(id, updateMeetingDto) {
        const meeting = await this.meetingModel.findByIdAndUpdate(id, updateMeetingDto, {
            new: true,
            runValidators: true,
        });
        if (!meeting)
            throw new common_1.NotFoundException(`Meeting with ID ${id} not found`);
        return meeting;
    }
    async updateStatus(id, status, errorMessage) {
        const updateData = { status };
        if (errorMessage)
            updateData.errorMessage = errorMessage;
        const meeting = await this.meetingModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!meeting)
            throw new common_1.NotFoundException(`Meeting with ID ${id} not found`);
        return meeting;
    }
    async processWithTranscriptText(id, fullText, segments, source = 'teams-native') {
        let meeting = null;
        try {
            meeting = await this.findOne(id);
            await this.updateStatus(id, meeting_schema_1.MeetingStatus.TRANSCRIBING);
            const transcript = await this.transcriptsService.create({
                meetingId: id,
                fullText,
                segments: segments.map((s) => ({
                    start: s.start,
                    end: s.end,
                    text: s.text,
                    speaker: s.speaker,
                })),
                language: 'en',
                duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
                source,
            });
            await this.meetingModel.findByIdAndUpdate(id, { transcriptId: transcript._id });
            await this.updateStatus(id, meeting_schema_1.MeetingStatus.TRANSCRIBED);
            await this.updateStatus(id, meeting_schema_1.MeetingStatus.ANALYZING);
            this.logger.log(`Analyzing transcript for meeting ${id}...`);
            const startTime = Date.now();
            const analysis = await this.aiProvider.analyzeTranscript(fullText, meeting.subject);
            const processingTimeMs = Date.now() - startTime;
            const summary = await this.summariesService.create({
                meetingId: id,
                transcriptId: transcript._id.toString(),
                summary: analysis.summary,
                keyPoints: analysis.keyPoints,
                actionItems: analysis.actionItems,
                decisions: analysis.decisions,
                sentiment: analysis.sentiment,
                topics: analysis.topics,
                processingTimeMs,
            });
            await this.meetingModel.findByIdAndUpdate(id, { summaryId: summary._id });
            await this.updateStatus(id, meeting_schema_1.MeetingStatus.COMPLETED);
            this.logger.log(`Meeting ${id} fully processed in ${processingTimeMs}ms`);
            return await this.findOne(id);
        }
        catch (error) {
            const errorMsg = error.message || 'Unknown error';
            this.logger.error(`Failed to process meeting ${id}: ${errorMsg}`);
            if (meeting)
                await this.updateStatus(id, meeting_schema_1.MeetingStatus.FAILED, errorMsg);
            throw new common_1.InternalServerErrorException(`Failed to process meeting: ${errorMsg}`);
        }
    }
    async processWithRecording(id, audioBuffer) {
        let meeting = null;
        try {
            meeting = await this.findOne(id);
            const storageKey = `recordings/${id}.webm`;
            await this.storageProvider.upload(storageKey, audioBuffer, 'audio/webm');
            await this.meetingModel.findByIdAndUpdate(id, {
                recordingStorageKey: storageKey,
                status: meeting_schema_1.MeetingStatus.RECORDING_AVAILABLE,
            });
            await this.updateStatus(id, meeting_schema_1.MeetingStatus.TRANSCRIBING);
            this.logger.log(`Transcribing recording for meeting ${id}...`);
            const transcriptionResult = await this.speechProvider.transcribe(audioBuffer, {
                language: 'en',
                format: 'verbose_json',
            });
            return await this.processWithTranscriptText(id, transcriptionResult.text, transcriptionResult.segments, 'whisper');
        }
        catch (error) {
            const errorMsg = error.message || 'Unknown error';
            this.logger.error(`Failed to process recording for meeting ${id}: ${errorMsg}`);
            if (meeting)
                await this.updateStatus(id, meeting_schema_1.MeetingStatus.FAILED, errorMsg);
            throw new common_1.InternalServerErrorException(`Failed to process recording: ${errorMsg}`);
        }
    }
    async processMeeting(id) {
        const meeting = await this.findOne(id);
        if (!meeting.recordingStorageKey) {
            throw new common_1.BadRequestException('Recording is not available for this meeting');
        }
        const recordingBuffer = await this.storageProvider.download(meeting.recordingStorageKey);
        return this.processWithRecording(id, recordingBuffer);
    }
    async getStats() {
        const [total, completed, failed, processing] = await Promise.all([
            this.meetingModel.countDocuments(),
            this.meetingModel.countDocuments({ status: meeting_schema_1.MeetingStatus.COMPLETED }),
            this.meetingModel.countDocuments({ status: meeting_schema_1.MeetingStatus.FAILED }),
            this.meetingModel.countDocuments({
                status: { $in: [meeting_schema_1.MeetingStatus.TRANSCRIBING, meeting_schema_1.MeetingStatus.ANALYZING] },
            }),
        ]);
        return {
            total,
            completed,
            failed,
            processing,
            pending: total - completed - failed - processing,
        };
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = MeetingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(meeting_schema_1.Meeting.name)),
    __param(1, (0, common_1.Inject)(interfaces_1.SPEECH_PROVIDER)),
    __param(2, (0, common_1.Inject)(interfaces_1.AI_PROVIDER)),
    __param(3, (0, common_1.Inject)(interfaces_1.STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, Object, Object, transcripts_service_1.TranscriptsService,
        summaries_service_1.SummariesService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map