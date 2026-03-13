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
exports.TranscriptSchema = exports.Transcript = exports.TranscriptSegmentSchema = exports.TranscriptSegment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let TranscriptSegment = class TranscriptSegment {
};
exports.TranscriptSegment = TranscriptSegment;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], TranscriptSegment.prototype, "start", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], TranscriptSegment.prototype, "end", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TranscriptSegment.prototype, "text", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TranscriptSegment.prototype, "speaker", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], TranscriptSegment.prototype, "confidence", void 0);
exports.TranscriptSegment = TranscriptSegment = __decorate([
    (0, mongoose_1.Schema)()
], TranscriptSegment);
exports.TranscriptSegmentSchema = mongoose_1.SchemaFactory.createForClass(TranscriptSegment);
let Transcript = class Transcript {
};
exports.Transcript = Transcript;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Meeting', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transcript.prototype, "meetingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transcript.prototype, "fullText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [exports.TranscriptSegmentSchema] }),
    __metadata("design:type", Array)
], Transcript.prototype, "segments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transcript.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Transcript.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 'whisper' }),
    __metadata("design:type", String)
], Transcript.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transcript.prototype, "storageKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Transcript.prototype, "wordCount", void 0);
exports.Transcript = Transcript = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Transcript);
exports.TranscriptSchema = mongoose_1.SchemaFactory.createForClass(Transcript);
exports.TranscriptSchema.index({ meetingId: 1 });
//# sourceMappingURL=transcript.schema.js.map