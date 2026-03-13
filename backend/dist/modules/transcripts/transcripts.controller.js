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
exports.TranscriptsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transcripts_service_1 = require("./transcripts.service");
const create_transcript_dto_1 = require("./dto/create-transcript.dto");
let TranscriptsController = class TranscriptsController {
    constructor(transcriptsService) {
        this.transcriptsService = transcriptsService;
    }
    async create(createTranscriptDto) {
        return this.transcriptsService.create(createTranscriptDto);
    }
    async findAll() {
        return this.transcriptsService.findAll();
    }
    async findByMeetingId(meetingId) {
        return this.transcriptsService.findByMeetingId(meetingId);
    }
    async findOne(id) {
        return this.transcriptsService.findOne(id);
    }
    async delete(id) {
        await this.transcriptsService.delete(id);
        return { message: 'Transcript deleted successfully' };
    }
};
exports.TranscriptsController = TranscriptsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new transcript' }),
    (0, swagger_1.ApiBody)({ type: create_transcript_dto_1.CreateTranscriptDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Transcript created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transcript_dto_1.CreateTranscriptDto]),
    __metadata("design:returntype", Promise)
], TranscriptsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all transcripts' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'List of all transcripts',
        isArray: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TranscriptsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('meeting/:meetingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transcripts by meeting ID' }),
    (0, swagger_1.ApiParam)({ name: 'meetingId', description: 'Meeting ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'List of transcripts for the meeting',
        isArray: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid meetingId format',
    }),
    __param(0, (0, common_1.Param)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TranscriptsController.prototype, "findByMeetingId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a transcript by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transcript ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Transcript found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Transcript not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid transcript ID format',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TranscriptsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a transcript' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Transcript ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Transcript deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Transcript not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid transcript ID format',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TranscriptsController.prototype, "delete", null);
exports.TranscriptsController = TranscriptsController = __decorate([
    (0, swagger_1.ApiTags)('transcripts'),
    (0, common_1.Controller)('transcripts'),
    __metadata("design:paramtypes", [transcripts_service_1.TranscriptsService])
], TranscriptsController);
//# sourceMappingURL=transcripts.controller.js.map