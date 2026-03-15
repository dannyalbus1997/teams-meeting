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
exports.MeetingSchema = exports.Meeting = exports.MeetingStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var MeetingStatus;
(function (MeetingStatus) {
    MeetingStatus["DETECTED"] = "detected";
    MeetingStatus["LIVE"] = "live";
    MeetingStatus["RECORDING_AVAILABLE"] = "recording_available";
    MeetingStatus["TRANSCRIBING"] = "transcribing";
    MeetingStatus["TRANSCRIBED"] = "transcribed";
    MeetingStatus["ANALYZING"] = "analyzing";
    MeetingStatus["COMPLETED"] = "completed";
    MeetingStatus["FAILED"] = "failed";
})(MeetingStatus || (exports.MeetingStatus = MeetingStatus = {}));
let Meeting = class Meeting {
};
exports.Meeting = Meeting;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Meeting.prototype, "teamsEventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Meeting.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Meeting.prototype, "organizer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [String] }),
    __metadata("design:type", Array)
], Meeting.prototype, "participants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Meeting.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Meeting.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Meeting.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Meeting.prototype, "joinUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Meeting.prototype, "recordingUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Meeting.prototype, "recordingStorageKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: MeetingStatus }),
    (0, mongoose_1.Prop)({ type: String, enum: MeetingStatus, default: MeetingStatus.DETECTED }),
    __metadata("design:type", String)
], Meeting.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Transcript' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Meeting.prototype, "transcriptId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Summary' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Meeting.prototype, "summaryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Meeting.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Meeting.prototype, "metadata", void 0);
exports.Meeting = Meeting = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Meeting);
exports.MeetingSchema = mongoose_1.SchemaFactory.createForClass(Meeting);
exports.MeetingSchema.index({ teamsEventId: 1 }, { unique: true });
exports.MeetingSchema.index({ startTime: -1 });
exports.MeetingSchema.index({ status: 1 });
//# sourceMappingURL=meeting.schema.js.map