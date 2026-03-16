import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { MeetingStatus } from './schemas/meeting.schema';
import { GraphService } from '../graph/graph.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  private readonly logger = new Logger(MeetingsController.name);

  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly graphService: GraphService,
    private readonly authService: AuthService,
  ) {}

  // ──────────────────────────────────────────────
  //  Step 1: Sync meetings from Microsoft Graph
  // ──────────────────────────────────────────────

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync meetings from Microsoft Graph calendar into the database' })
  @ApiQuery({ name: 'daysBack', required: false, description: 'How many days back to sync (default 7)' })
  async syncMeetings(@Query('daysBack') daysBack?: string) {
    const days = daysBack ? parseInt(daysBack, 10) : 7;
    return this.meetingsService.syncMeetings(days);
  }

  // ──────────────────────────────────────────────
  //  Standard CRUD (static routes BEFORE :id)
  // ──────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get meeting statistics' })
  async getStats() {
    return this.meetingsService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'List all meetings' })
  @ApiQuery({ name: 'status', enum: MeetingStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() query: QueryMeetingsDto) {
    return this.meetingsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a meeting manually' })
  async create(@Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(dto);
  }

  // ──────────────────────────────────────────────
  //  Diagnostics (static routes — must be BEFORE :id)
  // ──────────────────────────────────────────────

  @Get('graph-raw')
  @ApiOperation({ summary: 'Raw Graph API test — see exact response from Microsoft' })
  @ApiQuery({ name: 'path', required: true, description: 'Graph API path e.g. /users/{id}/onlineMeetings' })
  @ApiQuery({ name: 'api', required: false, description: 'v1.0 or beta (default v1.0)' })
  async graphRaw(
    @Query('path') path: string,
    @Query('api') api?: string,
  ) {
    if (!this.authService.isConfigured()) {
      return { error: 'Not configured' };
    }

    const { accessToken } = await this.authService.getAppAccessToken();
    const apiVersion = (api === 'beta' ? 'beta' : 'v1.0') as 'v1.0' | 'beta';

    this.logger.log(`Raw Graph API call: ${apiVersion} ${path}`);
    const result = await this.graphService.rawGraphGet(accessToken, path, apiVersion);
    return { apiVersion, path, ...result };
  }

  @Get('test-graph')
  @ApiOperation({ summary: 'Full Graph API diagnostic — test permissions and list online meetings' })
  @ApiQuery({ name: 'meetingId', required: false, description: 'DB meeting ID to diagnose' })
  async testGraph(@Query('meetingId') meetingId?: string) {
    const results: any = { timestamp: new Date().toISOString(), steps: [] };

    if (!this.authService.isConfigured()) {
      results.steps.push({ step: 'auth', result: 'FAIL — not configured' });
      return results;
    }

    const { accessToken } = await this.authService.getAppAccessToken();
    const targetUserId = this.authService.getTargetUserId();
    results.targetUserId = targetUserId;
    results.steps.push({ step: 'auth', result: 'OK' });

    // Step 1: Test basic permission — can we read the user's profile?
    const profileResult = await this.graphService.rawGraphGet(accessToken, `/users/${targetUserId}`, 'v1.0');
    results.steps.push({
      step: 'getUserProfile',
      result: profileResult.data ? `OK — ${profileResult.data.displayName} (${profileResult.data.id})` : `FAIL — HTTP ${profileResult.status}`,
      rawError: profileResult.error,
    });

    // Gather user IDs to try
    const userIds = new Set<string>();
    userIds.add(targetUserId);
    if (profileResult.data?.id && profileResult.data.id !== targetUserId) {
      userIds.add(profileResult.data.id);
    }

    let dbMeeting: any = null;
    if (meetingId) {
      try {
        dbMeeting = await this.meetingsService.findOne(meetingId);
        results.dbMeeting = {
          subject: dbMeeting.subject,
          joinUrl: dbMeeting.joinUrl?.substring(0, 120),
          organizerEmail: dbMeeting.organizerEmail,
          onlineMeetingId: dbMeeting.onlineMeetingId,
        };

        const oid = this.graphService.extractOidFromJoinUrl(dbMeeting.joinUrl || '');
        if (oid) userIds.add(oid);
        if (dbMeeting.organizerEmail) userIds.add(dbMeeting.organizerEmail);
      } catch (err: any) {
        results.steps.push({ step: 'loadMeeting', result: `FAIL — ${err.message}` });
      }
    }

    results.userIdsTested = Array.from(userIds);

    // Step 1b: Resolve all user IDs to Object IDs (GUIDs)
    const resolvedOids = new Set<string>();
    for (const uid of userIds) {
      const oid = await this.graphService.resolveUserObjectId(accessToken, uid);
      resolvedOids.add(oid);
    }
    results.resolvedOids = Array.from(resolvedOids);

    // Step 2: For each resolved OID, try listing online meetings with raw API calls
    for (const uid of resolvedOids) {
      for (const api of ['v1.0', 'beta'] as const) {
        const listResult = await this.graphService.rawGraphGet(
          accessToken,
          `/users/${uid}/onlineMeetings`,
          api,
        );

        const meetings = listResult.data?.value || [];
        results.steps.push({
          step: `listOnlineMeetings(${uid}, ${api})`,
          result: listResult.data
            ? `OK — ${meetings.length} meeting(s)`
            : `FAIL — HTTP ${listResult.status}`,
          meetings: meetings.slice(0, 5).map((m: any) => ({
            id: m.id,
            subject: m.subject,
            joinWebUrl: m.joinWebUrl?.substring(0, 120),
          })),
          rawError: listResult.error ? {
            code: listResult.error?.error?.code,
            message: listResult.error?.error?.message?.substring(0, 300),
          } : undefined,
        });

        // If we found meetings and have a DB meeting, try matching by URL
        if (meetings.length > 0 && dbMeeting?.joinUrl) {
          const dbBase = dbMeeting.joinUrl.split('?')[0].toLowerCase();
          const match = meetings.find((m: any) =>
            m.joinWebUrl && m.joinWebUrl.split('?')[0].toLowerCase() === dbBase,
          );
          if (match) {
            results.steps.push({
              step: `MATCH_FOUND(${uid}, ${api})`,
              result: `Meeting matched! id=${match.id}, subject=${match.subject}`,
            });
          }
        }
      }
    }

    return results;
  }

  // ──────────────────────────────────────────────
  //  Parameterized routes (:id) — MUST be LAST
  // ──────────────────────────────────────────────

  @Post(':id/fetch-transcript')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch the transcript from Microsoft Graph for this meeting and save to DB' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async fetchTranscript(@Param('id') id: string) {
    return this.meetingsService.fetchTranscript(id);
  }

  @Post(':id/summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize the transcript using OpenAI GPT-4o' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async summarize(@Param('id') id: string) {
    return this.meetingsService.summarize(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meeting by ID (with transcript and summary populated)' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async findOne(@Param('id') id: string) {
    return this.meetingsService.findOneWithDetails(id);
  }

  @Get(':id/diagnose')
  @ApiOperation({ summary: 'Diagnose why transcript fetch might be failing for a meeting' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  async diagnose(@Param('id') id: string) {
    const meeting = await this.meetingsService.findOne(id);
    const results: any = {
      meetingId: id,
      subject: meeting.subject,
      status: meeting.status,
      joinUrl: meeting.joinUrl || '(none)',
      organizerEmail: meeting.organizerEmail || '(none)',
      hasTranscript: !!meeting.transcriptId,
      hasSummary: !!meeting.summaryId,
      isConfigured: this.authService.isConfigured(),
      steps: [],
    };

    if (!this.authService.isConfigured()) {
      results.steps.push({ step: 'auth', result: 'FAIL — not configured' });
      return results;
    }

    let accessToken: string;
    try {
      const tokens = await this.authService.getAppAccessToken();
      accessToken = tokens.accessToken;
      results.steps.push({ step: 'auth', result: 'OK' });
    } catch (err: any) {
      results.steps.push({ step: 'auth', result: `FAIL — ${err.message}` });
      return results;
    }

    if (!meeting.joinUrl) {
      results.steps.push({ step: 'joinUrl', result: 'FAIL — no joinUrl' });
      return results;
    }

    const targetUserId = this.authService.getTargetUserId();
    const oid = this.graphService.extractOidFromJoinUrl(meeting.joinUrl);
    results.organizerOidFromUrl = oid || '(none)';

    // Try resolving via OData filter
    const resolved = await this.graphService.getOnlineMeetingByJoinUrl(
      accessToken, targetUserId, meeting.joinUrl, meeting.organizerEmail,
    );

    if (!resolved) {
      results.steps.push({ step: 'resolveViaFilter', result: 'FAIL — JoinWebUrl filter returned nothing' });

      const candidates = new Set<string>();
      if (oid) candidates.add(oid);
      if (meeting.organizerEmail) candidates.add(meeting.organizerEmail);
      candidates.add(targetUserId);

      // Resolve candidates to Object IDs first
      const resolvedCandidates = new Set<string>();
      for (const c of candidates) {
        const oid = await this.graphService.resolveUserObjectId(accessToken, c);
        resolvedCandidates.add(oid);
      }

      for (const uid of resolvedCandidates) {
        // Use raw API to see exact error
        for (const api of ['v1.0', 'beta'] as const) {
          const rawResult = await this.graphService.rawGraphGet(
            accessToken,
            `/users/${uid}/onlineMeetings`,
            api,
          );
          const meetings = rawResult.data?.value || [];
          results.steps.push({
            step: `rawList(${uid}, ${api})`,
            httpStatus: rawResult.status,
            result: rawResult.data ? `${meetings.length} meeting(s)` : 'FAIL',
            meetings: meetings.slice(0, 5).map((m: any) => ({
              id: m.id,
              subject: m.subject,
              joinWebUrl: m.joinWebUrl?.substring(0, 100),
            })),
            rawError: rawResult.error ? {
              code: rawResult.error?.error?.code,
              message: rawResult.error?.error?.message?.substring(0, 200),
            } : undefined,
          });
        }
      }

      return results;
    }

    results.steps.push({ step: 'resolve', result: `OK → ${resolved.meetingId} via ${resolved.resolvedViaUserId}` });
    const userId = resolved.resolvedViaUserId;

    const transcripts = await this.graphService.listMeetingTranscripts(accessToken, userId, resolved.meetingId);
    results.steps.push({ step: 'transcripts', result: `Found ${transcripts.length}` });

    if (transcripts.length > 0) {
      try {
        const vtt = await this.graphService.getTranscriptContent(accessToken, userId, resolved.meetingId, transcripts[0].id, 'text/vtt');
        const parsed = this.graphService.parseVttTranscript(vtt);
        results.steps.push({ step: 'transcriptContent', result: `OK — ${parsed.segments.length} segments, ${parsed.fullText.length} chars` });
        results.transcriptPreview = parsed.fullText.substring(0, 500);
      } catch (err: any) {
        results.steps.push({ step: 'transcriptContent', result: `FAIL — ${err.message}` });
      }
    }

    const recordings = await this.graphService.listMeetingRecordings(accessToken, userId, resolved.meetingId);
    results.steps.push({ step: 'recordings', result: `Found ${recordings.length}` });

    return results;
  }
}
