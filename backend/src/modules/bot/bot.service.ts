import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Meeting, MeetingDocument, MeetingStatus } from '../meetings/schemas/meeting.schema';
import { MeetingsService } from '../meetings/meetings.service';
import { GraphService } from '../graph/graph.service';

export interface BotCallInfo {
  callId: string;
  meetingId: string; // our DB meeting ID
  joinUrl: string;
  status: 'joining' | 'joined' | 'recording' | 'leaving' | 'ended' | 'failed';
  startedAt: Date;
  recordingStartedAt?: Date;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private graphClient: AxiosInstance;

  // App-level access token (client credentials, not user-delegated)
  private appAccessToken: string | null = null;
  private appTokenExpiresAt: Date | null = null;

  // Track active calls
  private activeCalls: Map<string, BotCallInfo> = new Map();

  // User access token (for fetching recordings after meeting)
  private userAccessToken: string | null = null;

  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    private configService: ConfigService,
    private meetingsService: MeetingsService,
    private graphService: GraphService,
  ) {
    this.graphClient = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setUserAccessToken(token: string) {
    this.userAccessToken = token;
  }

  /**
   * Get an application-level access token using client credentials flow.
   * This is required for Calls.JoinGroupCall.All (application permission).
   */
  async getAppAccessToken(): Promise<string> {
    if (this.appAccessToken && this.appTokenExpiresAt && this.appTokenExpiresAt > new Date()) {
      return this.appAccessToken;
    }

    const tenantId = this.configService.get<string>('bot.tenantId');
    const clientId = this.configService.get<string>('bot.appId');
    const clientSecret = this.configService.get<string>('bot.appSecret');

    if (!tenantId || !clientId || !clientSecret) {
      throw new BadRequestException(
        'Bot is not configured. Set BOT_APP_ID, BOT_APP_SECRET, BOT_TENANT_ID in .env',
      );
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const response = await axios.post(tokenUrl, new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.appAccessToken = response.data.access_token;
      this.appTokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      this.logger.log('Bot app access token acquired');
      return this.appAccessToken!;
    } catch (error: any) {
      const msg = error?.response?.data?.error_description || error.message;
      this.logger.error(`Failed to get app access token: ${msg}`);
      throw new BadRequestException(`Bot auth failed: ${msg}`);
    }
  }

  /**
   * Join a Teams meeting as a bot using the Communications API.
   * Requires application permission: Calls.JoinGroupCall.All
   */
  async joinMeeting(meetingDbId: string): Promise<BotCallInfo> {
    const meeting = await this.meetingsService.findOne(meetingDbId);

    if (!meeting.joinUrl) {
      throw new BadRequestException(
        'This meeting has no join URL. Sync meetings first to get the join URL.',
      );
    }

    // Check if already in this meeting
    for (const [, info] of this.activeCalls) {
      if (info.meetingId === meetingDbId && !['ended', 'failed'].includes(info.status)) {
        this.logger.log(`Bot is already in meeting ${meetingDbId} (call ${info.callId})`);
        return info;
      }
    }

    const token = await this.getAppAccessToken();
    const callbackBaseUrl = this.configService.get<string>('bot.callbackBaseUrl');
    const appId = this.configService.get<string>('bot.appId');

    try {
      // Join the meeting
      const response = await this.graphClient.post(
        '/communications/calls',
        {
          '@odata.type': '#microsoft.graph.call',
          callbackUri: `${callbackBaseUrl}/bot/callback`,
          requestedModalities: ['audio'],
          mediaConfig: {
            '@odata.type': '#microsoft.graph.serviceHostedMediaConfig',
          },
          chatInfo: {
            '@odata.type': '#microsoft.graph.chatInfo',
            threadId: this.extractThreadId(meeting.joinUrl),
            messageId: '0',
          },
          meetingInfo: {
            '@odata.type': '#microsoft.graph.organizerMeetingInfo',
            organizer: {
              '@odata.type': '#microsoft.graph.identitySet',
              user: {
                '@odata.type': '#microsoft.graph.identity',
                id: appId,
                tenantId: this.configService.get<string>('bot.tenantId'),
              },
            },
          },
          tenantId: this.configService.get<string>('bot.tenantId'),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const callId = response.data.id;

      const callInfo: BotCallInfo = {
        callId,
        meetingId: meetingDbId,
        joinUrl: meeting.joinUrl,
        status: 'joining',
        startedAt: new Date(),
      };

      this.activeCalls.set(callId, callInfo);

      // Update meeting status
      await this.meetingsService.updateStatus(meetingDbId, MeetingStatus.LIVE);

      this.logger.log(`Bot joining meeting "${meeting.subject}" — call ID: ${callId}`);
      return callInfo;
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to join meeting: ${msg}`);

      // If the Communications API join fails, try a simpler approach
      // Just use JoinWebUrl directly
      return this.joinMeetingByUrl(meetingDbId, meeting, token, callbackBaseUrl!);
    }
  }

  /**
   * Alternative join method using joinWebUrl directly
   */
  private async joinMeetingByUrl(
    meetingDbId: string,
    meeting: MeetingDocument,
    token: string,
    callbackBaseUrl: string,
  ): Promise<BotCallInfo> {
    try {
      const response = await this.graphClient.post(
        '/communications/calls',
        {
          '@odata.type': '#microsoft.graph.call',
          callbackUri: `${callbackBaseUrl}/bot/callback`,
          requestedModalities: ['audio'],
          mediaConfig: {
            '@odata.type': '#microsoft.graph.serviceHostedMediaConfig',
          },
          chatInfo: {
            '@odata.type': '#microsoft.graph.chatInfo',
            threadId: this.extractThreadId(meeting.joinUrl),
            messageId: '0',
          },
          meetingInfo: {
            '@odata.type': '#microsoft.graph.joinMeetingIdMeetingInfo',
            joinMeetingId: this.extractMeetingId(meeting.joinUrl),
          },
          tenantId: this.configService.get<string>('bot.tenantId'),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const callId = response.data.id;
      const callInfo: BotCallInfo = {
        callId,
        meetingId: meetingDbId,
        joinUrl: meeting.joinUrl,
        status: 'joining',
        startedAt: new Date(),
      };

      this.activeCalls.set(callId, callInfo);
      await this.meetingsService.updateStatus(meetingDbId, MeetingStatus.LIVE);

      this.logger.log(`Bot joining meeting via URL — call ID: ${callId}`);
      return callInfo;
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to join meeting by URL: ${msg}`);
      throw new BadRequestException(`Bot could not join meeting: ${msg}`);
    }
  }

  /**
   * Start recording the call.
   * Uses the updateRecordingStatus API to signal Teams to record.
   */
  async startRecording(callId: string): Promise<void> {
    const callInfo = this.activeCalls.get(callId);
    if (!callInfo) {
      throw new BadRequestException(`No active call with ID: ${callId}`);
    }

    const token = await this.getAppAccessToken();

    try {
      await this.graphClient.post(
        `/communications/calls/${callId}/updateRecordingStatus`,
        {
          clientContext: `recording-${callInfo.meetingId}`,
          status: 'recording',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      callInfo.status = 'recording';
      callInfo.recordingStartedAt = new Date();
      this.logger.log(`Recording started for call ${callId}`);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to start recording: ${msg}`);
      throw new BadRequestException(`Failed to start recording: ${msg}`);
    }
  }

  /**
   * Leave the meeting (hang up the call).
   */
  async leaveMeeting(callId: string): Promise<void> {
    const callInfo = this.activeCalls.get(callId);
    if (!callInfo) {
      throw new BadRequestException(`No active call with ID: ${callId}`);
    }

    const token = await this.getAppAccessToken();

    try {
      await this.graphClient.delete(`/communications/calls/${callId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      callInfo.status = 'ended';
      this.logger.log(`Bot left meeting — call ${callId}`);

      // Trigger transcript/recording fetch after leaving
      this.processAfterLeaving(callInfo).catch((err) => {
        this.logger.error(`Post-meeting processing failed: ${err.message}`);
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      this.logger.warn(`Failed to leave meeting cleanly: ${msg}`);
      callInfo.status = 'ended';
    }
  }

  /**
   * After the bot leaves, wait a bit then try to fetch the recording/transcript.
   */
  private async processAfterLeaving(callInfo: BotCallInfo): Promise<void> {
    this.logger.log(
      `Waiting 30s for Teams to finalize recording for meeting ${callInfo.meetingId}...`,
    );

    // Wait for Teams to process the recording
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      // Try processing using user token if available
      if (this.userAccessToken) {
        await this.meetingsService.processMeeting(callInfo.meetingId, this.userAccessToken);
        this.logger.log(`Meeting ${callInfo.meetingId} processed successfully after bot left`);
      } else {
        this.logger.warn(
          `No user access token available for post-meeting processing. ` +
          `Trigger processing manually via /api/meetings/${callInfo.meetingId}/process`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Post-meeting processing failed: ${error.message}`);
      // Don't throw — this is a background task
    }
  }

  /**
   * Handle Graph API callback notifications for call state changes.
   */
  async handleCallNotification(notification: any): Promise<void> {
    const callId = notification?.resourceData?.id || notification?.resource?.split('/').pop();

    if (!callId) {
      this.logger.warn('Received callback without call ID');
      return;
    }

    const callInfo = this.activeCalls.get(callId);
    const state = notification?.resourceData?.state;

    this.logger.log(`Call ${callId} state changed to: ${state}`);

    if (!callInfo) {
      this.logger.warn(`Received callback for unknown call: ${callId}`);
      return;
    }

    switch (state) {
      case 'established':
        callInfo.status = 'joined';
        this.logger.log(`Bot successfully joined meeting (call ${callId})`);
        // Auto-start recording when joined
        try {
          await this.startRecording(callId);
        } catch (err: any) {
          this.logger.warn(`Auto-record failed: ${err.message}. Recording may need manual start.`);
        }
        break;

      case 'terminated':
        callInfo.status = 'ended';
        this.logger.log(`Call ${callId} terminated`);
        this.processAfterLeaving(callInfo).catch((err) => {
          this.logger.error(`Post-call processing failed: ${err.message}`);
        });
        break;

      default:
        this.logger.log(`Unhandled call state: ${state} for call ${callId}`);
    }
  }

  /**
   * Get all active bot calls.
   */
  getActiveCalls(): BotCallInfo[] {
    return Array.from(this.activeCalls.values()).filter(
      (c) => !['ended', 'failed'].includes(c.status),
    );
  }

  /**
   * Get call info by meeting DB ID.
   */
  getCallByMeetingId(meetingId: string): BotCallInfo | undefined {
    for (const [, info] of this.activeCalls) {
      if (info.meetingId === meetingId && !['ended', 'failed'].includes(info.status)) {
        return info;
      }
    }
    return undefined;
  }

  /**
   * Extract the thread ID from a Teams join URL.
   * Format: https://teams.microsoft.com/l/meetup-join/19%3ameeting_...%40thread.v2/...
   */
  private extractThreadId(joinUrl: string): string {
    try {
      const decoded = decodeURIComponent(joinUrl);
      const match = decoded.match(/19:meeting_[^/]+@thread\.v2/);
      if (match) return match[0];

      // Try extracting from URL path
      const urlMatch = joinUrl.match(/meetup-join\/([^/]+)/);
      if (urlMatch) return decodeURIComponent(urlMatch[1]);

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Extract meeting ID from a Teams join URL.
   */
  private extractMeetingId(joinUrl: string): string {
    try {
      const match = joinUrl.match(/[?&](?:meetingId|mid)=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    } catch {
      return '';
    }
  }
}
