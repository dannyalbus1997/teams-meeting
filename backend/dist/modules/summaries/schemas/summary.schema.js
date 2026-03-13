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
exports.SummarySchema = exports.Summary = exports.ActionItemSchema = exports.ActionItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let ActionItem = class ActionItem {
};
exports.ActionItem = ActionItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ActionItem.prototype, "assignee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ActionItem.prototype, "task", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ActionItem.prototype, "deadline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['high', 'medium', 'low'] }),
    __metadata("design:type", String)
], ActionItem.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ActionItem.prototype, "completed", void 0);
exports.ActionItem = ActionItem = __decorate([
    (0, mongoose_1.Schema)()
], ActionItem);
exports.ActionItemSchema = mongoose_1.SchemaFactory.createForClass(ActionItem);
let Summary = class Summary {
};
exports.Summary = Summary;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Meeting', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Summary.prototype, "meetingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Transcript', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Summary.prototype, "transcriptId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Summary.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [String] }),
    __metadata("design:type", Array)
], Summary.prototype, "keyPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [exports.ActionItemSchema] }),
    __metadata("design:type", Array)
], Summary.prototype, "actionItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [String] }),
    __metadata("design:type", Array)
], Summary.prototype, "decisions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [String] }),
    __metadata("design:type", Array)
], Summary.prototype, "topics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Summary.prototype, "sentiment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: 'auto' }),
    __metadata("design:type", String)
], Summary.prototype, "aiProvider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Summary.prototype, "modelUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Summary.prototype, "processingTimeMs", void 0);
exports.Summary = Summary = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Summary);
exports.SummarySchema = mongoose_1.SchemaFactory.createForClass(Summary);
exports.SummarySchema.index({ meetingId: 1 });
//# sourceMappingURL=summary.schema.js.map