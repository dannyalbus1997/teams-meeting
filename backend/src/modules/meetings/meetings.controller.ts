import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MeetingsService } from './meetings.service';
import { MeetingSyncService } from './meetings-sync.service';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { SummariesService } from '../summaries/summaries.service';
import { GraphService } from '../graph/graph.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { Meeting, MeetingStatus } from './schemas/meeting.schema';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  private readonly logger = new Logger(MeetingsController.name);

  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly meetingSyncService: MeetingSyncService,
    private readonly transcriptsService: TranscriptsService,
    private readonly summariesService: SummariesService,
    private readonly graphService: GraphService,
  ) {}

  // ──────────────────────────────────────────────
  //  Sync & Webhook endpoints
  // ──────────────────────────────────────────────

  @Get('sync')
  @ApiOperation({ summary: 'Trigger meeting sync (GET for browser, also works as status check)' })
  async syncMeetingsGet() {
    return this.meetingSyncService.syncNow();
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger meeting sync from Microsoft Graph',
  })
  async syncMeetings() {
    return this.meetingSyncService.syncNow();
  }

  @Get('sync/status')
  @ApiOperation({ summary: 'Check if meeting sync is active (authenticated)' })
  async getSyncStatus() {
    return {
      authenticated: this.meetingSyncService.getIsAuthenticated(),
      message: this.meetingSyncService.getIsAuthenticated()
        ? 'Sync is active — meetings are polled every minute'
        : 'Not authenticated. Login at /api/auth/login to activate auto-sync',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get meeting statistics for dashboard' })
  async getStats() {
    return this.meetingsService.getStats();
  }

  /**
   * Microsoft Graph webhook validation endpoint.
   * Graph sends a validation request when creating a subscription.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for Microsoft Graph change notifications' })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // Validation: Graph sends ?validationToken=... when creating subscription
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      this.logger.log('Webhook validation request received');
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(validationToken);
    }

    // Actual notification
    const notifications = req.body?.value;
    if (notifications && Array.isArray(notifications)) {
      for (const notification of notifications) {
        // Verify client state for security
        if (notification.clientState !== 'teams-meeting-summarizer-secret') {
          this.logger.warn('Invalid clientState in webhook notification');
          continue;
        }

        this.logger.log(
          `Webhook notification: ${notification.changeType} on ${notification.resource}`,
        );

        // Trigger a sync when we get a call record notification
        if (notification.resource?.includes('callRecords')) {
          // Fire and forget — don't block the webhook response
          this.meetingSyncService.syncNow().catch((err) => {
            this.logger.error(`Webhook-triggered sync failed: ${err.message}`);
          });
        }
      }
    }

    return res.status(202).json({ status: 'accepted' });
  }

  // ──────────────────────────────────────────────
  //  Standard CRUD
  // ──────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: HttpStatus.CREATED, type: Meeting })
  async create(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.create(createMeetingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all meetings with pagination and filters' })
  @ApiQuery({ name: 'status', enum: MeetingStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(@Query() query: QueryMeetingsDto) {
    return this.meetingsService.findAll(query);
  }

  @Get(':id/diagnose')
  @ApiOperation({ summary: 'Debug: diagnose why transcript/recording fetch fails for a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async diagnoseMeeting(@Param('id') id: string) {
    const meeting = await this.meetingsService.findOne(id);
    const accessToken = this.meetingSyncService.getAccessToken();
    const results: any = {
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

      // Check transcripts
      const transcripts = await this.graphService.listMeetingTranscripts(accessToken, onlineMeeting.meetingId);
      results.transcriptsFound = transcripts.length;
      if (transcripts.length === 0) {
        results.steps.push({ step: 'listTranscripts', result: 'FAIL — no transcripts found. Was "Start transcription" clicked during the meeting? Also needs OnlineMeetingTranscript.Read.All permission.' });
      } else {
        results.steps.push({ step: 'listTranscripts', result: `OK — found ${transcripts.length} transcript(s)` });

        try {
          const vtt = await this.graphService.getTranscriptContent(accessToken, onlineMeeting.meetingId, transcripts[0].id, 'text/vtt');
          const parsed = this.graphService.parseVttTranscript(vtt);
          results.steps.push({ step: 'fetchTranscriptContent', result: `OK — ${parsed.segments.length} segments, ${parsed.fullText.length} chars` });
          results.transcriptPreview = parsed.fullText.substring(0, 500);
        } catch (err: any) {
          results.steps.push({ step: 'fetchTranscriptContent', result: `FAIL — ${err.message}` });
        }
      }

      // Check recordings
      const recordings = await this.graphService.listMeetingRecordings(accessToken, onlineMeeting.meetingId);
      results.recordingsFound = recordings.length;
      if (recordings.length === 0) {
        results.steps.push({ step: 'listRecordings', result: 'No recordings found.' });
      } else {
        results.steps.push({ step: 'listRecordings', result: `OK — found ${recordings.length} recording(s)` });
      }
    } catch (err: any) {
      results.steps.push({ step: 'graphApiCall', result: `FAIL — ${err.message}` });
    }

    return results;
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get transcript for a specific meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async getTranscript(@Param('id') id: string) {
    const transcripts = await this.transcriptsService.findByMeetingId(id);
    if (transcripts.length === 0) {
      return null;
    }
    return transcripts[transcripts.length - 1]; // Return the latest transcript
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get AI summary for a specific meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async getSummary(@Param('id') id: string) {
    const summaries = await this.summariesService.findByMeetingId(id);
    if (summaries.length === 0) {
      return null;
    }
    return summaries[summaries.length - 1]; // Return the latest summary
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific meeting by ID' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async update(@Param('id') id: string, @Body() updateMeetingDto: UpdateMeetingDto) {
    return this.meetingsService.update(id, updateMeetingDto);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger meeting processing (transcription + summarization)' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async processMeeting(@Param('id') id: string) {
    // Pass the access token so processMeeting can fetch from Graph API if needed
    const accessToken = this.meetingSyncService.getAccessToken();
    return this.meetingsService.processMeeting(id, accessToken || undefined);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get the processing status of a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async getStatus(@Param('id') id: string) {
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
}
