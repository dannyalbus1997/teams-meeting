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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSummaryDto = exports.ActionItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ActionItemDto {
}
exports.ActionItemDto = ActionItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Assignee name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActionItemDto.prototype, "assignee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Task description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActionItemDto.prototype, "task", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task deadline' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActionItemDto.prototype, "deadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Task priority',
        enum: ['high', 'medium', 'low'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['high', 'medium', 'low']),
    __metadata("design:type", String)
], ActionItemDto.prototype, "priority", void 0);
class CreateSummaryDto {
}
exports.CreateSummaryDto = CreateSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Meeting ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "meetingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transcript ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "transcriptId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Summary text' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Key points', isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSummaryDto.prototype, "keyPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Action items',
        isArray: true,
        type: ActionItemDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ActionItemDto),
    __metadata("design:type", Array)
], CreateSummaryDto.prototype, "actionItems", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Decisions made', isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSummaryDto.prototype, "decisions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Meeting topics', isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSummaryDto.prototype, "topics", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Overall sentiment (positive, neutral, negative)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "sentiment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI provider used for summarization' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "aiProvider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI model used' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSummaryDto.prototype, "modelUsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Processing time in milliseconds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSummaryDto.prototype, "processingTimeMs", void 0);
//# sourceMappingURL=create-summary.dto.js.map