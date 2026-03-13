import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GraphService } from '../graph/graph.service';
import { MeetingsService } from './meetings.service';
import { Meeting, MeetingDocument, MeetingStatus } from './schemas/meeting.schema';

@Injectable()
export class MeetingSyncService {
  private readonly logger = new Logger(MeetingSyncService.name);

  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    private graphService: GraphService,
    private meetingsService: MeetingsService,
    private configService: ConfigService,
  ) {}

  setAccessToken(token: string, expiresAt: Date) {
    this.accessToken = token;
    this.tokenExpiresAt = expiresAt;
    this.logger.log('Access token updated — automatic meeting sync is now active');
  }

  getIsAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiresAt && this.tokenExpiresAt > new Date();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncMeetings() {
    if (!this.getIsAuthenticated()) {
      return;
    }

    try {
      this.logger.log('Starting meeting sync...');

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 60 * 60 * 1000);

      const events = await this.graphService.getCalendarEvents(
        this.accessToken!,
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

  private async processCalendarEvent(event: any) {
    try {
      const existing = await this.meetingModel
        .findOne({ teamsEventId: event.id })
        .exec();

      if (existing && existing.status === MeetingStatus.COMPLETED) {
        return;
      }

      const meetingEndTime = new Date(event.end);
      const hasEnded = meetingEndTime < new Date();

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
          joinUrl: event.onlineMeetingUrl || '',
        });

        this.logger.log(`New meeting detected: "${event.subject}" (${meeting._id})`);

        if (hasEnded) {
          await this.tryFetchTranscript(meeting, event);
        }
      } else if (
        hasEnded &&
        [MeetingStatus.DETECTED, MeetingStatus.RECORDING_AVAILABLE].includes(
          existing.status as MeetingStatus,
        )
      ) {
        await this.tryFetchTranscript(existing, event);
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to process event "${event.subject}": ${error.message}`,
      );
    }
  }

  private async tryFetchTranscript(meeting: MeetingDocument, event: any) {
    try {
      if (!event.onlineMeetingUrl) {
        this.logger.warn(`No join URL for meeting "${event.subject}"`);
        return;
      }

      const token = this.accessToken!;

      // Resolve online meeting ID
      const onlineMeeting = await this.graphService.getOnlineMeetingByJoinUrl(
        token,
        event.onlineMeetingUrl,
      );

      if (!onlineMeeting) {
        this.logger.warn(`Could not resolve online meeting ID for "${event.subject}"`);
        return;
      }

      const onlineMeetingId = onlineMeeting.meetingId;

      // Try native transcript first
      const transcripts = await this.graphService.listMeetingTranscripts(
        token,
        onlineMeetingId,
      );

      if (transcripts.length > 0) {
        this.logger.log(
          `Found ${transcripts.length} transcript(s) for "${event.subject}" — fetching...`,
        );

        const latestTranscript = transcripts[transcripts.length - 1];
        const vttContent = await this.graphService.getTranscriptContent(
          token,
          onlineMeetingId,
          latestTranscript.id,
          'text/vtt',
        );

        const parsed = this.graphService.parseVttTranscript(vttContent);

        if (parsed.fullText.length > 0) {
          await this.meetingsService.processWithTranscriptText(
            meeting._id.toString(),
            parsed.fullText,
            parsed.segments,
            'teams-native',
          );

          this.logger.log(`Meeting "${event.subject}" — transcript saved and AI analysis triggered`);
          return;
        }
      }

      // Fallback: recording for Whisper
      const recordings = await this.graphService.listMeetingRecordings(
        token,
        onlineMeetingId,
      );

      if (recordings.length > 0) {
        this.logger.log(
          `Found ${recordings.length} recording(s) for "${event.subject}" — downloading...`,
        );

        const latestRecording = recordings[recordings.length - 1];
        const audioBuffer = await this.graphService.getRecordingContent(
          token,
          onlineMeetingId,
          latestRecording.id,
        );

        await this.meetingsService.processWithRecording(
          meeting._id.toString(),
          audioBuffer,
        );

        this.logger.log(`Meeting "${event.subject}" — recording downloaded, processing started`);
        return;
      }

      this.logger.log(
        `No transcripts or recordings available yet for "${event.subject}"`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch transcript/recording for "${event.subject}": ${error.message}`,
      );
    }
  }

  async syncNow(): Promise<{ synced: number; message: string }> {
    if (!this.getIsAuthenticated()) {
      return { synced: 0, message: 'Not authenticated. Please login first at /api/auth/login' };
    }

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 60 * 60 * 1000);

    const events = await this.graphService.getCalendarEvents(
      this.accessToken!,
      startDate,
      endDate,
    );

    for (const event of events) {
      await this.processCalendarEvent(event);
    }

    return {
      synced: events.length,
      message: `Found ${events.length} online meeting(s) in the last 24 hours`,
    };
  }
}
