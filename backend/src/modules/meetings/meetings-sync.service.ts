import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GraphService } from '../graph/graph.service';
import { AuthService } from '../auth/auth.service';
import { MeetingsService } from './meetings.service';
import { Meeting, MeetingDocument, MeetingStatus } from './schemas/meeting.schema';

@Injectable()
export class MeetingSyncService {
  private readonly logger = new Logger(MeetingSyncService.name);

  // Cache resolved online meeting IDs
  private onlineMeetingIdCache: Map<string, string> = new Map();

  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    private graphService: GraphService,
    private authService: AuthService,
    private meetingsService: MeetingsService,
    private configService: ConfigService,
  ) {}

  /**
   * Check if the app is properly configured for automatic sync.
   */
  getIsAuthenticated(): boolean {
    return this.authService.isConfigured();
  }

  /**
   * Get a fresh app access token (auto-refreshed by AuthService).
   */
  private async getAccessToken(): Promise<string> {
    const tokens = await this.authService.getAppAccessToken();
    return tokens.accessToken;
  }

  /**
   * Get the target user ID for Graph API calls.
   */
  private getTargetUserId(): string {
    return this.authService.getTargetUserId();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncMeetings() {
    if (!this.getIsAuthenticated()) {
      return;
    }

    try {
      this.logger.log('Starting meeting sync...');

      const accessToken = await this.getAccessToken();
      const userId = this.getTargetUserId();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const events = await this.graphService.getCalendarEvents(
        accessToken,
        userId,
        startDate,
        endDate,
      );

      this.logger.log(`Found ${events.length} online meeting events`);

      for (const event of events) {
        await this.processCalendarEvent(event);
      }
    } catch (error: any) {
      this.logger.error(`Meeting sync failed: ${error.message}`);
    }
  }

  /**
   * Extract a Teams join URL from the meeting body HTML as a last resort.
   */
  private extractJoinUrlFromBody(bodyContent: string): string {
    if (!bodyContent) return '';
    // Look for Teams join link in the HTML body
    const match = bodyContent.match(/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s"<]+/);
    return match ? match[0].replace(/&amp;/g, '&') : '';
  }

  private async processCalendarEvent(event: any) {
    try {
      const existing = await this.meetingModel
        .findOne({ teamsEventId: event.id })
        .exec();

      if (existing && existing.status === MeetingStatus.COMPLETED) {
        return;
      }

      // Resolve join URL from multiple sources
      let joinUrl = event.onlineMeetingUrl || '';
      if (!joinUrl && event.bodyContent) {
        joinUrl = this.extractJoinUrlFromBody(event.bodyContent);
        if (joinUrl) {
          this.logger.log(`Extracted join URL from meeting body for "${event.subject}"`);
        }
      }

      const now = new Date();
      const meetingStartTime = new Date(event.start);
      const meetingEndTime = new Date(event.end);
      const hasEnded = meetingEndTime < now;
      const isLive = meetingStartTime <= now && meetingEndTime >= now;

      if (!existing) {
        const meeting = await this.meetingsService.create({
          teamsEventId: event.id,
          subject: event.subject,
          organizer: event.organizer?.displayName || 'Unknown',
          participants: (event.attendees || []).map(
            (a: any) => a.displayName || a.emailAddress,
          ),
          startTime: event.start,
          endTime: event.end,
          joinUrl,
        });

        this.logger.log(
          `New meeting detected: "${event.subject}" (${meeting._id}) — ${isLive ? 'LIVE NOW' : hasEnded ? 'ENDED' : 'UPCOMING'}`,
        );

        if (isLive) {
          await this.meetingsService.updateStatus(meeting._id.toString(), MeetingStatus.LIVE);
          await this.tryFetchTranscript(meeting, event, true);
        } else if (hasEnded) {
          await this.tryFetchTranscript(meeting, event, false);
        }
      } else {
        // Backfill joinUrl if missing on existing meeting
        if (!existing.joinUrl && joinUrl) {
          await this.meetingModel.findByIdAndUpdate(existing._id, { joinUrl });
          this.logger.log(`Backfilled joinUrl for existing meeting "${event.subject}"`);
        }

        // Update to LIVE if currently happening
        if (isLive && existing.status === MeetingStatus.DETECTED) {
          await this.meetingsService.updateStatus(existing._id.toString(), MeetingStatus.LIVE);
        }

        // Live meetings: fetch partial transcript every poll
        if (isLive && [MeetingStatus.DETECTED, MeetingStatus.LIVE].includes(existing.status as MeetingStatus)) {
          await this.tryFetchTranscript(existing, event, true);
        }

        // Ended meetings: full processing
        if (
          hasEnded &&
          [MeetingStatus.DETECTED, MeetingStatus.LIVE, MeetingStatus.RECORDING_AVAILABLE].includes(
            existing.status as MeetingStatus,
          )
        ) {
          await this.tryFetchTranscript(existing, event, false);
        }
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to process event "${event.subject}": ${error.message}`,
      );
    }
  }

  private async resolveOnlineMeetingId(joinUrl: string): Promise<string | null> {
    if (this.onlineMeetingIdCache.has(joinUrl)) {
      return this.onlineMeetingIdCache.get(joinUrl)!;
    }

    const accessToken = await this.getAccessToken();
    const userId = this.getTargetUserId();
    const onlineMeeting = await this.graphService.getOnlineMeetingByJoinUrl(
      accessToken,
      userId,
      joinUrl,
    );

    if (onlineMeeting) {
      this.onlineMeetingIdCache.set(joinUrl, onlineMeeting.meetingId);
      return onlineMeeting.meetingId;
    }

    return null;
  }

  /**
   * Fetch transcript for a meeting.
   * isLive=true:  save partial transcript, no AI analysis yet
   * isLive=false: save full transcript + run AI analysis + generate summary
   */
  private async tryFetchTranscript(
    meeting: MeetingDocument,
    event: any,
    isLive: boolean,
  ) {
    try {
      if (!event.onlineMeetingUrl) {
        this.logger.warn(`No join URL for meeting "${event.subject}"`);
        return;
      }

      const accessToken = await this.getAccessToken();
      const userId = this.getTargetUserId();
      const onlineMeetingId = await this.resolveOnlineMeetingId(event.onlineMeetingUrl);

      if (!onlineMeetingId) {
        this.logger.warn(`Could not resolve online meeting ID for "${event.subject}"`);
        return;
      }

      // Try native transcript
      const transcripts = await this.graphService.listMeetingTranscripts(
        accessToken,
        userId,
        onlineMeetingId,
      );

      if (transcripts.length > 0) {
        const latestTranscript = transcripts[transcripts.length - 1];
        const vttContent = await this.graphService.getTranscriptContent(
          accessToken,
          userId,
          onlineMeetingId,
          latestTranscript.id,
          'text/vtt',
        );

        const parsed = this.graphService.parseVttTranscript(vttContent);

        if (parsed.fullText.length > 0) {
          if (isLive) {
            // Live: save/update partial transcript, no AI yet
            await this.meetingsService.savePartialTranscript(
              meeting._id.toString(),
              parsed.fullText,
              parsed.segments,
              'teams-native-live',
            );
            this.logger.log(
              `LIVE "${event.subject}" — partial transcript updated (${parsed.segments.length} segments)`,
            );
          } else {
            // Ended: full processing
            await this.meetingsService.processWithTranscriptText(
              meeting._id.toString(),
              parsed.fullText,
              parsed.segments,
              'teams-native',
            );
            this.logger.log(
              `Meeting "${event.subject}" — transcript saved and AI analysis triggered`,
            );
          }
          return;
        }
      }

      // Fallback: recording (only for ended meetings)
      if (!isLive) {
        const recordings = await this.graphService.listMeetingRecordings(
          accessToken,
          userId,
          onlineMeetingId,
        );

        if (recordings.length > 0) {
          const latestRecording = recordings[recordings.length - 1];
          const audioBuffer = await this.graphService.getRecordingContent(
            accessToken,
            userId,
            onlineMeetingId,
            latestRecording.id,
          );

          await this.meetingsService.processWithRecording(
            meeting._id.toString(),
            audioBuffer,
          );

          this.logger.log(
            `Meeting "${event.subject}" — recording downloaded, processing started`,
          );
          return;
        }
      }

      this.logger.log(
        `No transcripts available yet for "${event.subject}"${isLive ? ' (live - will retry next poll)' : ''}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch transcript for "${event.subject}": ${error.message}`,
      );
    }
  }

  async syncNow(): Promise<{ synced: number; message: string }> {
    if (!this.getIsAuthenticated()) {
      return { synced: 0, message: 'Not configured. Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, and AZURE_TARGET_USER_ID in .env' };
    }

    const accessToken = await this.getAccessToken();
    const userId = this.getTargetUserId();
    const startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const events = await this.graphService.getCalendarEvents(
      accessToken,
      userId,
      startDate,
      endDate,
    );

    for (const event of events) {
      await this.processCalendarEvent(event);
    }

    return {
      synced: events.length,
      message: `Found ${events.length} online meeting(s)`,
    };
  }
}
