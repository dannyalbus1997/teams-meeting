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
var MeetingSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const graph_service_1 = require("../graph/graph.service");
const meetings_service_1 = require("./meetings.service");
const meeting_schema_1 = require("./schemas/meeting.schema");
let MeetingSyncService = MeetingSyncService_1 = class MeetingSyncService {
    constructor(meetingModel, graphService, meetingsService, configService) {
        this.meetingModel = meetingModel;
        this.graphService = graphService;
        this.meetingsService = meetingsService;
        this.configService = configService;
        this.logger = new common_1.Logger(MeetingSyncService_1.name);
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }
    setAccessToken(token, expiresAt) {
        this.accessToken = token;
        this.tokenExpiresAt = expiresAt;
        this.logger.log('Access token updated — automatic meeting sync is now active');
    }
    getIsAuthenticated() {
        return !!this.accessToken && !!this.tokenExpiresAt && this.tokenExpiresAt > new Date();
    }
    async syncMeetings() {
        if (!this.getIsAuthenticated()) {
            return;
        }
        try {
            this.logger.log('Starting meeting sync...');
            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const endDate = new Date(Date.now() + 60 * 60 * 1000);
            const events = await this.graphService.getCalendarEvents(this.accessToken, startDate, endDate);
            this.logger.log(`Found ${events.length} online meeting events`);
            for (const event of events) {
                await this.processCalendarEvent(event);
            }
        }
        catch (error) {
            this.logger.error(`Meeting sync failed: ${error.message}`);
        }
    }
    async processCalendarEvent(event) {
        try {
            const existing = await this.meetingModel
                .findOne({ teamsEventId: event.id })
                .exec();
            if (existing && existing.status === meeting_schema_1.MeetingStatus.COMPLETED) {
                return;
            }
            const meetingEndTime = new Date(event.end);
            const hasEnded = meetingEndTime < new Date();
            if (!existing) {
                const meeting = await this.meetingsService.create({
                    teamsEventId: event.id,
                    subject: event.subject,
                    organizer: event.organizer?.displayName || 'Unknown',
                    participants: (event.attendees || []).map((a) => a.displayName || a.emailAddress),
                    startTime: event.start,
                    endTime: event.end,
                    joinUrl: event.onlineMeetingUrl || '',
                });
                this.logger.log(`New meeting detected: "${event.subject}" (${meeting._id})`);
                if (hasEnded) {
                    await this.tryFetchTranscript(meeting, event);
                }
            }
            else if (hasEnded &&
                [meeting_schema_1.MeetingStatus.DETECTED, meeting_schema_1.MeetingStatus.RECORDING_AVAILABLE].includes(existing.status)) {
                await this.tryFetchTranscript(existing, event);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to process event "${event.subject}": ${error.message}`);
        }
    }
    async tryFetchTranscript(meeting, event) {
        try {
            if (!event.onlineMeetingUrl) {
                this.logger.warn(`No join URL for meeting "${event.subject}"`);
                return;
            }
            const token = this.accessToken;
            const onlineMeeting = await this.graphService.getOnlineMeetingByJoinUrl(token, event.onlineMeetingUrl);
            if (!onlineMeeting) {
                this.logger.warn(`Could not resolve online meeting ID for "${event.subject}"`);
                return;
            }
            const onlineMeetingId = onlineMeeting.meetingId;
            const transcripts = await this.graphService.listMeetingTranscripts(token, onlineMeetingId);
            if (transcripts.length > 0) {
                this.logger.log(`Found ${transcripts.length} transcript(s) for "${event.subject}" — fetching...`);
                const latestTranscript = transcripts[transcripts.length - 1];
                const vttContent = await this.graphService.getTranscriptContent(token, onlineMeetingId, latestTranscript.id, 'text/vtt');
                const parsed = this.graphService.parseVttTranscript(vttContent);
                if (parsed.fullText.length > 0) {
                    await this.meetingsService.processWithTranscriptText(meeting._id.toString(), parsed.fullText, parsed.segments, 'teams-native');
                    this.logger.log(`Meeting "${event.subject}" — transcript saved and AI analysis triggered`);
                    return;
                }
            }
            const recordings = await this.graphService.listMeetingRecordings(token, onlineMeetingId);
            if (recordings.length > 0) {
                this.logger.log(`Found ${recordings.length} recording(s) for "${event.subject}" — downloading...`);
                const latestRecording = recordings[recordings.length - 1];
                const audioBuffer = await this.graphService.getRecordingContent(token, onlineMeetingId, latestRecording.id);
                await this.meetingsService.processWithRecording(meeting._id.toString(), audioBuffer);
                this.logger.log(`Meeting "${event.subject}" — recording downloaded, processing started`);
                return;
            }
            this.logger.log(`No transcripts or recordings available yet for "${event.subject}"`);
        }
        catch (error) {
            this.logger.error(`Failed to fetch transcript/recording for "${event.subject}": ${error.message}`);
        }
    }
    async syncNow() {
        if (!this.getIsAuthenticated()) {
            return { synced: 0, message: 'Not authenticated. Please login first at /api/auth/login' };
        }
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endDate = new Date(Date.now() + 60 * 60 * 1000);
        const events = await this.graphService.getCalendarEvents(this.accessToken, startDate, endDate);
        for (const event of events) {
            await this.processCalendarEvent(event);
        }
        return {
            synced: events.length,
            message: `Found ${events.length} online meeting(s) in the last 24 hours`,
        };
    }
};
exports.MeetingSyncService = MeetingSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingSyncService.prototype, "syncMeetings", null);
exports.MeetingSyncService = MeetingSyncService = MeetingSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(meeting_schema_1.Meeting.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        graph_service_1.GraphService,
        meetings_service_1.MeetingsService,
        config_1.ConfigService])
], MeetingSyncService);
//# sourceMappingURL=meetings-sync.service.js.map