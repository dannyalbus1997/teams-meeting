"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const meeting_schema_1 = require("./schemas/meeting.schema");
const meetings_service_1 = require("./meetings.service");
const meetings_controller_1 = require("./meetings.controller");
const meetings_sync_service_1 = require("./meetings-sync.service");
const transcripts_module_1 = require("../transcripts/transcripts.module");
const summaries_module_1 = require("../summaries/summaries.module");
const speech_module_1 = require("../speech/speech.module");
const ai_module_1 = require("../ai/ai.module");
const storage_module_1 = require("../storage/storage.module");
const graph_module_1 = require("../graph/graph.module");
let MeetingsModule = class MeetingsModule {
};
exports.MeetingsModule = MeetingsModule;
exports.MeetingsModule = MeetingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: meeting_schema_1.Meeting.name, schema: meeting_schema_1.MeetingSchema }]),
            (0, common_1.forwardRef)(() => transcripts_module_1.TranscriptsModule),
            (0, common_1.forwardRef)(() => summaries_module_1.SummariesModule),
            (0, common_1.forwardRef)(() => speech_module_1.SpeechModule),
            (0, common_1.forwardRef)(() => ai_module_1.AiModule),
            (0, common_1.forwardRef)(() => storage_module_1.StorageModule),
            graph_module_1.GraphModule,
        ],
        controllers: [meetings_controller_1.MeetingsController],
        providers: [meetings_service_1.MeetingsService, meetings_sync_service_1.MeetingSyncService],
        exports: [meetings_service_1.MeetingsService, meetings_sync_service_1.MeetingSyncService],
    })
], MeetingsModule);
//# sourceMappingURL=meetings.module.js.map