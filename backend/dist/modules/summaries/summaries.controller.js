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
exports.SummariesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const summaries_service_1 = require("./summaries.service");
const create_summary_dto_1 = require("./dto/create-summary.dto");
const update_action_item_dto_1 = require("./dto/update-action-item.dto");
let SummariesController = class SummariesController {
    constructor(summariesService) {
        this.summariesService = summariesService;
    }
    async create(createSummaryDto) {
        return this.summariesService.create(createSummaryDto);
    }
    async findAll() {
        return this.summariesService.findAll();
    }
    async findByMeetingId(meetingId) {
        return this.summariesService.findByMeetingId(meetingId);
    }
    async findOne(id) {
        return this.summariesService.findOne(id);
    }
    async toggleActionItem(id, updateActionItemDto) {
        return this.summariesService.toggleActionItem(id, updateActionItemDto);
    }
    async delete(id) {
        await this.summariesService.delete(id);
        return { message: 'Summary deleted successfully' };
    }
};
exports.SummariesController = SummariesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new summary' }),
    (0, swagger_1.ApiBody)({ type: create_summary_dto_1.CreateSummaryDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Summary created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_summary_dto_1.CreateSummaryDto]),
    __metadata("design:returntype", Promise)
], SummariesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all summaries' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'List of all summaries',
        isArray: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SummariesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('meeting/:meetingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get summaries by meeting ID' }),
    (0, swagger_1.ApiParam)({ name: 'meetingId', description: 'Meeting ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'List of summaries for the meeting',
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
], SummariesController.prototype, "findByMeetingId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a summary by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Summary ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Summary found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Summary not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid summary ID format',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummariesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/action-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle action item completion status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Summary ID', type: String }),
    (0, swagger_1.ApiBody)({ type: update_action_item_dto_1.UpdateActionItemDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Action item status updated',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Summary not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid request data',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_action_item_dto_1.UpdateActionItemDto]),
    __metadata("design:returntype", Promise)
], SummariesController.prototype, "toggleActionItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a summary' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Summary ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Summary deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Summary not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid summary ID format',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummariesController.prototype, "delete", null);
exports.SummariesController = SummariesController = __decorate([
    (0, swagger_1.ApiTags)('summaries'),
    (0, common_1.Controller)('summaries'),
    __metadata("design:paramtypes", [summaries_service_1.SummariesService])
], SummariesController);
//# sourceMappingURL=summaries.controller.js.map