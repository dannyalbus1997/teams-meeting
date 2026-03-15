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
var MeetingsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const meetings_service_1 = require("./meetings.service");
const meetings_sync_service_1 = require("./meetings-sync.service");
const transcripts_service_1 = require("../transcripts/transcripts.service");
const summaries_service_1 = require("../summaries/summaries.service");
const graph_service_1 = require("../graph/graph.service");
const create_meeting_dto_1 = require("./dto/create-meeting.dto");
const update_meeting_dto_1 = require("./dto/update-meeting.dto");
const query_meetings_dto_1 = require("./dto/query-meetings.dto");
const meeting_schema_1 = require("./schemas/meeting.schema");
let MeetingsController = MeetingsController_1 = class MeetingsController {
    constructor(meetingsService, meetingSyncService, transcriptsService, summariesService, graphService) {
        this.meetingsService = meetingsService;
        this.meetingSyncService = meetingSyncService;
        this.transcriptsService = transcriptsService;
        this.summariesService = summariesService;
        this.graphService = graphService;
        this.logger = new common_1.Logger(MeetingsController_1.name);
    }
    async syncMeetingsGet() {
        return this.meetingSyncService.syncNow();
    }
    async syncMeetings() {
        return this.meetingSyncService.syncNow();
    }
    async getSyncStatus() {
        return {
            authenticated: this.meetingSyncService.getIsAuthenticated(),
            message: this.meetingSyncService.getIsAuthenticated()
                ? 'Sync is active — meetings are polled every minute'
                : 'Not authenticated. Login at /api/auth/login to activate auto-sync',
        };
    }
    async getStats() {
        return this.meetingsService.getStats();
    }
    async handleWebhook(req, res) {
        const validationToken = req.query.validationToken;
        if (validationToken) {
            this.logger.log('Webhook validation request received');
            res.set('Content-Type', 'text/plain');
            return res.status(200).send(validationToken);
        }
        const notifications = req.body?.value;
        if (notifications && Array.isArray(notifications)) {
            for (const notification of notifications) {
                if (notification.clientState !== 'teams-meeting-summarizer-secret') {
                    this.logger.warn('Invalid clientState in webhook notification');
                    continue;
                }
                this.logger.log(`Webhook notification: ${notification.changeType} on ${notification.resource}`);
                if (notification.resource?.includes('callRecords')) {
                    this.meetingSyncService.syncNow().catch((err) => {
                        this.logger.error(`Webhook-triggered sync failed: ${err.message}`);
                    });
                }
            }
        }
        return res.status(202).json({ status: 'accepted' });
    }
    async create(createMeetingDto) {
        return this.meetingsService.create(createMeetingDto);
    }
    async findAll(query) {
        return this.meetingsService.findAll(query);
    }
    async diagnoseMeeting(id) {
        const meeting = await this.meetingsService.findOne(id);
        const accessToken = this.meetingSyncService.getAccessToken();
        const results = {
            meetingId: id,
            subject: meeting.subject,
            status: meeting.status,
            joinUrl: meeting.joinUrl || '(none)',
            hasTranscriptInDb: !!meeting.transcriptId,
            hasSummaryInDb: !!meeting.summaryId,
            hasRecordingKey: !!meeting.recordingStorageKey,
            isAuthenticated: this.meetingSyncService.getIsAuthenticated(),
            steps: [],
        };
        if (!accessToken) {
            results.steps.push({ step: 'auth', result: 'FAIL — no access token. Login at /api/auth/login first.' });
            return results;
        }
        results.steps.push({ step: 'auth', result: 'OK — access token available' });
        if (!meeting.joinUrl) {
            results.steps.push({ step: 'joinUrl', result: 'FAIL — meeting has no joinUrl stored. Cannot resolve online meeting.' });
            return results;
        }
        results.steps.push({ step: 'joinUrl', result: `OK — ${meeting.joinUrl.substring(0, 80)}...` });
        try {
            const onlineMeeting = await this.graphService.getOnlineMeetingByJoinUrl(accessToken, meeting.joinUrl);
            if (!onlineMeeting) {
                results.steps.push({ step: 'resolveOnlineMeeting', result: 'FAIL — could not resolve online meeting from joinUrl. Check OnlineMeetings.Read permission.' });
                return results;
            }
            results.onlineMeetingId = onlineMeeting.meetingId;
            results.steps.push({ step: 'resolveOnlineMeeting', result: `OK — resolved to ${onlineMeeting.meetingId}` });
            const transcripts = await this.graphService.listMeetingTranscripts(accessToken, onlineMeeting.meetingId);
            results.transcriptsFound = transcripts.length;
            if (transcripts.length === 0) {
                results.steps.push({ step: 'listTranscripts', result: 'FAIL — no transcripts found. Was "Start transcription" clicked during the meeting? Also needs OnlineMeetingTranscript.Read.All permission.' });
            }
            else {
                results.steps.push({ step: 'listTranscripts', result: `OK — found ${transcripts.length} transcript(s)` });
                try {
                    const vtt = await this.graphService.getTranscriptContent(accessToken, onlineMeeting.meetingId, transcripts[0].id, 'text/vtt');
                    const parsed = this.graphService.parseVttTranscript(vtt);
                    results.steps.push({ step: 'fetchTranscriptContent', result: `OK — ${parsed.segments.length} segments, ${parsed.fullText.length} chars` });
                    results.transcriptPreview = parsed.fullText.substring(0, 500);
                }
                catch (err) {
                    results.steps.push({ step: 'fetchTranscriptContent', result: `FAIL — ${err.message}` });
                }
            }
            const recordings = await this.graphService.listMeetingRecordings(accessToken, onlineMeeting.meetingId);
            results.recordingsFound = recordings.length;
            if (recordings.length === 0) {
                results.steps.push({ step: 'listRecordings', result: 'No recordings found.' });
            }
            else {
                results.steps.push({ step: 'listRecordings', result: `OK — found ${recordings.length} recording(s)` });
            }
        }
        catch (err) {
            results.steps.push({ step: 'graphApiCall', result: `FAIL — ${err.message}` });
        }
        return results;
    }
    async getTranscript(id) {
        const transcripts = await this.transcriptsService.findByMeetingId(id);
        if (transcripts.length === 0) {
            return null;
        }
        return transcripts[transcripts.length - 1];
    }
    async getSummary(id) {
        const summaries = await this.summariesService.findByMeetingId(id);
        if (summaries.length === 0) {
            return null;
        }
        return summaries[summaries.length - 1];
    }
    async findOne(id) {
        return this.meetingsService.findOne(id);
    }
    async update(id, updateMeetingDto) {
        return this.meetingsService.update(id, updateMeetingDto);
    }
    async processMeeting(id) {
        const accessToken = this.meetingSyncService.getAccessToken();
        return this.meetingsService.processMeeting(id, accessToken || undefined);
    }
    async getStatus(id) {
        const meeting = await this.meetingsService.findOne(id);
        return {
            id: meeting._id,
            status: meeting.status,
            subject: meeting.subject,
            transcriptId: meeting.transcriptId || null,
            summaryId: meeting.summaryId || null,
            errorMessage: meeting.errorMessage || null,
        };
    }
};
exports.MeetingsController = MeetingsController;
__decorate([
    (0, common_1.Get)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger meeting sync (GET for browser, also works as status check)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "syncMeetingsGet", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually trigger meeting sync from Microsoft Graph',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "syncMeetings", null);
__decorate([
    (0, common_1.Get)('sync/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if meeting sync is active (authenticated)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get meeting statistics for dashboard' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook endpoint for Microsoft Graph change notifications' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new meeting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: meeting_schema_1.Meeting }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_meeting_dto_1.CreateMeetingDto]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all meetings with pagination and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: meeting_schema_1.MeetingStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 20 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_meetings_dto_1.QueryMeetingsDto]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/diagnose'),
    (0, swagger_1.ApiOperation)({ summary: 'Debug: diagnose why transcript/recording fetch fails for a meeting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "diagnoseMeeting", null);
__decorate([
    (0, common_1.Get)(':id/transcript'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transcript for a specific meeting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getTranscript", null);
__decorate([
    (0, common_1.Get)(':id/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI summary for a specific meeting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific meeting by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a meeting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_meeting_dto_1.UpdateMeetingDto]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger meeting processing (transcription + summarization)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "processMeeting", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the processing status of a meeting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Meeting ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "getStatus", null);
exports.MeetingsController = MeetingsController = MeetingsController_1 = __decorate([
    (0, swagger_1.ApiTags)('meetings'),
    (0, common_1.Controller)('meetings'),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        meetings_sync_service_1.MeetingSyncService,
        transcripts_service_1.TranscriptsService,
        summaries_service_1.SummariesService,
        graph_service_1.GraphService])
], MeetingsController);
//# sourceMappingURL=meetings.controller.js.map