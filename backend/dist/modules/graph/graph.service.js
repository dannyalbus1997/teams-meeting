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
var GraphService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let GraphService = GraphService_1 = class GraphService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GraphService_1.name);
        this.axiosClient = axios_1.default.create({
            baseURL: 'https://graph.microsoft.com/v1.0',
            headers: { 'Content-Type': 'application/json' },
        });
        this.betaClient = axios_1.default.create({
            baseURL: 'https://graph.microsoft.com/beta',
            headers: { 'Content-Type': 'application/json' },
        });
    }
    getAuthHeaders(accessToken) {
        return {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };
    }
    async getCalendarEvents(accessToken, startDate, endDate) {
        try {
            const response = await this.axiosClient.get('/me/calendarview', {
                headers: this.getAuthHeaders(accessToken),
                params: {
                    startDateTime: startDate.toISOString(),
                    endDateTime: endDate.toISOString(),
                    $select: 'id,subject,start,end,organizer,attendees,isOnlineMeeting,onlineMeetingUrl,onlineMeeting,body',
                    $top: 100,
                },
            });
            const onlineMeetings = (response.data.value || []).filter((event) => event.isOnlineMeeting === true);
            return onlineMeetings.map((event) => {
                const joinUrl = event.onlineMeetingUrl ||
                    event.onlineMeeting?.joinUrl ||
                    event.onlineMeeting?.joinWebUrl ||
                    '';
                if (!joinUrl) {
                    this.logger.warn(`Meeting "${event.subject}" has no join URL. Available fields: ` +
                        `onlineMeetingUrl=${event.onlineMeetingUrl}, ` +
                        `onlineMeeting=${JSON.stringify(event.onlineMeeting || {})}`);
                }
                return {
                    id: event.id,
                    subject: event.subject || '(No subject)',
                    start: new Date(event.start.dateTime + 'Z'),
                    end: new Date(event.end.dateTime + 'Z'),
                    organizer: event.organizer?.emailAddress
                        ? {
                            displayName: event.organizer.emailAddress.name,
                            emailAddress: event.organizer.emailAddress.address,
                        }
                        : undefined,
                    attendees: (event.attendees || []).map((att) => ({
                        displayName: att.emailAddress?.name,
                        emailAddress: att.emailAddress?.address,
                    })),
                    isOnlineMeeting: true,
                    onlineMeetingUrl: joinUrl,
                    onlineMeetingId: event.onlineMeeting?.joinMeetingIdSettings?.joinMeetingId,
                    bodyContent: event.body?.content || '',
                };
            });
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to fetch calendar events');
        }
    }
    async getOnlineMeetingByJoinUrl(accessToken, joinWebUrl) {
        try {
            const encodedUrl = encodeURIComponent(joinWebUrl);
            const response = await this.axiosClient.get(`/me/onlineMeetings?$filter=JoinWebUrl eq '${encodedUrl}'`, { headers: this.getAuthHeaders(accessToken) });
            const meeting = response.data.value?.[0];
            if (!meeting)
                return null;
            return { meetingId: meeting.id, subject: meeting.subject };
        }
        catch (error) {
            this.logger.warn(`Could not resolve online meeting for URL: ${error.message}`);
            return null;
        }
    }
    async listMeetingTranscripts(accessToken, onlineMeetingId) {
        try {
            const response = await this.betaClient.get(`/me/onlineMeetings/${onlineMeetingId}/transcripts`, { headers: this.getAuthHeaders(accessToken) });
            return response.data.value || [];
        }
        catch (error) {
            this.logger.warn(`No transcripts found for meeting ${onlineMeetingId}: ${error.message}`);
            return [];
        }
    }
    async getTranscriptContent(accessToken, onlineMeetingId, transcriptId, format = 'text/vtt') {
        try {
            const response = await this.betaClient.get(`/me/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`, {
                headers: {
                    ...this.getAuthHeaders(accessToken),
                    Accept: format,
                },
                responseType: 'text',
            });
            return response.data;
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to fetch transcript content');
        }
    }
    async listMeetingRecordings(accessToken, onlineMeetingId) {
        try {
            const response = await this.betaClient.get(`/me/onlineMeetings/${onlineMeetingId}/recordings`, { headers: this.getAuthHeaders(accessToken) });
            return response.data.value || [];
        }
        catch (error) {
            this.logger.warn(`No recordings for meeting ${onlineMeetingId}: ${error.message}`);
            return [];
        }
    }
    async getRecordingContent(accessToken, onlineMeetingId, recordingId) {
        try {
            const response = await this.betaClient.get(`/me/onlineMeetings/${onlineMeetingId}/recordings/${recordingId}/content`, {
                headers: this.getAuthHeaders(accessToken),
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to download recording');
        }
    }
    async getRecentCallRecords(accessToken, fromDate) {
        try {
            const response = await this.axiosClient.get('/communications/callRecords', {
                headers: this.getAuthHeaders(accessToken),
                params: {
                    $filter: `startDateTime ge ${fromDate.toISOString()}`,
                    $top: 50,
                    $orderby: 'startDateTime desc',
                },
            });
            return response.data.value || [];
        }
        catch (error) {
            this.logger.warn(`Could not fetch call records: ${error.message}`);
            return [];
        }
    }
    async createSubscription(accessToken, resource, notificationUrl, changeType = 'created,updated', expirationMinutes = 4230) {
        try {
            const expirationDateTime = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
            const response = await this.axiosClient.post('/subscriptions', {
                changeType,
                notificationUrl,
                resource,
                expirationDateTime,
                clientState: 'teams-meeting-summarizer-secret',
            }, { headers: this.getAuthHeaders(accessToken) });
            this.logger.log(`Webhook subscription created for resource: ${resource}`);
            return response.data;
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to create webhook subscription');
        }
    }
    async renewSubscription(accessToken, subscriptionId, expirationMinutes = 4230) {
        try {
            const expirationDateTime = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
            const response = await this.axiosClient.patch(`/subscriptions/${subscriptionId}`, { expirationDateTime }, { headers: this.getAuthHeaders(accessToken) });
            return response.data;
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to renew subscription');
        }
    }
    async getUserProfile(accessToken) {
        try {
            const response = await this.axiosClient.get('/me', {
                headers: this.getAuthHeaders(accessToken),
                params: {
                    $select: 'id,displayName,mail,mobilePhone,jobTitle',
                },
            });
            return response.data;
        }
        catch (error) {
            this.handleGraphError(error, 'Failed to fetch user profile');
        }
    }
    parseVttTranscript(vttContent) {
        const lines = vttContent.split('\n');
        const segments = [];
        let fullText = '';
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
            if (timestampMatch) {
                const start = this.vttTimeToSeconds(timestampMatch[1]);
                const end = this.vttTimeToSeconds(timestampMatch[2]);
                i++;
                let text = '';
                let speaker;
                while (i < lines.length && lines[i].trim() !== '') {
                    const textLine = lines[i].trim();
                    const speakerMatch = textLine.match(/<v\s+([^>]+)>/);
                    if (speakerMatch) {
                        speaker = speakerMatch[1];
                        text += textLine.replace(/<v\s+[^>]+>/, '').replace(/<\/v>/, '') + ' ';
                    }
                    else {
                        text += textLine + ' ';
                    }
                    i++;
                }
                text = text.trim();
                if (text) {
                    segments.push({ start, end, text, speaker });
                    fullText += (speaker ? `${speaker}: ` : '') + text + '\n';
                }
            }
            i++;
        }
        return { fullText: fullText.trim(), segments };
    }
    vttTimeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseFloat(parts[2]);
        return hours * 3600 + minutes * 60 + seconds;
    }
    handleGraphError(error, defaultMessage) {
        if (axios_1.default.isAxiosError(error)) {
            const statusCode = error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error.response?.data?.error?.message || error.message;
            this.logger.error(`${defaultMessage}: ${statusCode} - ${errorMessage}`);
            throw new common_1.HttpException(`${defaultMessage}: ${errorMessage}`, statusCode);
        }
        throw new common_1.HttpException(`${defaultMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
};
exports.GraphService = GraphService;
exports.GraphService = GraphService = GraphService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GraphService);
//# sourceMappingURL=graph.service.js.map