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
exports.CreateTranscriptDto = exports.TranscriptSegmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TranscriptSegmentDto {
}
exports.TranscriptSegmentDto = TranscriptSegmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start time in seconds' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptSegmentDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End time in seconds' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptSegmentDto.prototype, "end", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Segment text content' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptSegmentDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Speaker name or identifier' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptSegmentDto.prototype, "speaker", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Confidence score (0-1)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptSegmentDto.prototype, "confidence", void 0);
class CreateTranscriptDto {
}
exports.CreateTranscriptDto = CreateTranscriptDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Meeting ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTranscriptDto.prototype, "meetingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full transcript text' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTranscriptDto.prototype, "fullText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transcript segments', isArray: true, type: TranscriptSegmentDto }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TranscriptSegmentDto),
    __metadata("design:type", Array)
], CreateTranscriptDto.prototype, "segments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Language code (e.g., en-US)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTranscriptDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Duration in seconds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTranscriptDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Transcript source (whisper, teams-native, manual)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTranscriptDto.prototype, "source", void 0);
//# sourceMappingURL=create-transcript.dto.js.map