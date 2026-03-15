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
    return this.meetingsService.processMeeting(id);
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
