import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument, MeetingStatus } from './schemas/meeting.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { GraphService } from '../graph/graph.service';
import { AuthService } from '../auth/auth.service';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { SummariesService } from '../summaries/summaries.service';
import { AI_PROVIDER, AiProvider } from '../../common/interfaces';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    private graphService: GraphService,
    private authService: AuthService,
    private transcriptsService: TranscriptsService,
    private summariesService: SummariesService,
    @Inject(AI_PROVIDER) private aiProvider: AiProvider,
  ) {}

  // ─── CRUD ────────────────────────────────────────────

  async create(dto: CreateMeetingDto): Promise<MeetingDocument> {
    // If calendarEventId provided, upsert to avoid duplicates
    if (dto.calendarEventId) {
      const existing = await this.meetingModel.findOne({ calendarEventId: dto.calendarEventId }).exec();
      if (existing) return existing;
    }
    const meeting = new this.meetingModel(dto);
    return meeting.save();
  }

  async findAll(query: QueryMeetingsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.startTime = {};
      if (query.startDate) filter.startTime.$gte = new Date(query.startDate);
      if (query.endDate) filter.startTime.$lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.meetingModel.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit).exec(),
      this.meetingModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<MeetingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid meeting ID: ${id}`);
    }
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);
    return meeting;
  }

  async findOneWithDetails(id: string) {
    const meeting = await this.findOne(id);
    const obj: any = meeting.toObject();

    if (meeting.transcriptId) {
      try { obj.transcript = await this.transcriptsService.findOne(meeting.transcriptId.toString()); }
      catch { obj.transcript = null; }
    }
    if (meeting.summaryId) {
      try { obj.summary = await this.summariesService.findOne(meeting.summaryId.toString()); }
      catch { obj.summary = null; }
    }
    return obj;
  }

  async getStats() {
    const [total, synced, transcriptFetched, summarized, failed] = await Promise.all([
      this.meetingModel.countDocuments(),
      this.meetingModel.countDocuments({ status: MeetingStatus.SYNCED }),
      this.meetingModel.countDocuments({ status: MeetingStatus.TRANSCRIPT_FETCHED }),
      this.meetingModel.countDocuments({ status: MeetingStatus.SUMMARIZED }),
      this.meetingModel.countDocuments({ status: MeetingStatus.FAILED }),
    ]);
    return { total, synced, transcriptFetched, summarized, failed };
  }

  // ─── STEP 1: Sync meetings from Graph calendar ──────

  async syncMeetings(daysBack: number = 7): Promise<{ synced: number; total: number }> {
    if (!this.authService.isConfigured()) {
      throw new BadRequestException(
        'Azure AD not configured. Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_TARGET_USER_ID in .env',
      );
    }

    const { accessToken } = await this.authService.getAppAccessToken();
    const userId = this.authService.getTargetUserId();
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    const events = await this.graphService.getCalendarEvents(accessToken, userId, startDate, endDate);
    this.logger.log(`Calendar returned ${events.length} online meeting(s)`);

    let synced = 0;
    for (const event of events) {
      try {
        // Resolve join URL from multiple fields
        const joinUrl = event.onlineMeetingUrl || '';
        const organizerEmail = event.organizer?.emailAddress || '';
        const organizerName = event.organizer?.displayName || '';

        const existing = await this.meetingModel.findOne({ calendarEventId: event.id }).exec();
        if (existing) continue;

        await this.meetingModel.create({
          subject: event.subject,
          startTime: event.start,
          endTime: event.end,
          organizerName,
          organizerEmail,
          attendees: (event.attendees || []).map((a: any) => a.displayName || a.emailAddress),
          joinUrl,
          calendarEventId: event.id,
          status: MeetingStatus.SYNCED,
        });
        synced++;
      } catch (err: any) {
        // Skip duplicate key errors (already synced)
        if (err.code === 11000) continue;
        this.logger.warn(`Failed to sync event "${event.subject}": ${err.message}`);
      }
    }

    this.logger.log(`Synced ${synced} new meeting(s) out of ${events.length} calendar events`);
    return { synced, total: events.length };
  }

  // ─── STEP 2: Fetch transcript from Graph API ────────

  async fetchTranscript(meetingId: string): Promise<MeetingDocument> {
    const meeting = await this.findOne(meetingId);

    if (!this.authService.isConfigured()) {
      throw new BadRequestException('Azure AD not configured');
    }

    if (!meeting.joinUrl) {
      throw new BadRequestException(`Meeting "${meeting.subject}" has no Teams join URL — cannot fetch transcript`);
    }

    const { accessToken } = await this.authService.getAppAccessToken();
    const targetUserId = this.authService.getTargetUserId();
    const organizerEmail = meeting.organizerEmail || '';

    // Step A: Resolve the online meeting
    this.logger.log(`Resolving online meeting for "${meeting.subject}"...`);

    // First try the JoinWebUrl filter approach
    let resolved = await this.graphService.getOnlineMeetingByJoinUrl(
      accessToken,
      targetUserId,
      meeting.joinUrl,
      organizerEmail,
    );

    // If JoinWebUrl filter didn't work, try listing all meetings and matching
    if (!resolved) {
      this.logger.log('JoinWebUrl filter failed — trying to list all meetings and match by URL...');
      resolved = await this.findOnlineMeetingByListing(accessToken, meeting.joinUrl, organizerEmail, targetUserId);
    }

    if (!resolved) {
      const errorMsg = `Could not resolve online meeting from joinUrl. Tried OData filter and full listing. Check OnlineMeetings.Read.All permission.`;
      await this.meetingModel.findByIdAndUpdate(meetingId, { status: MeetingStatus.FAILED, errorMessage: errorMsg });
      throw new BadRequestException(errorMsg);
    }

    const userId = resolved.resolvedViaUserId;
    this.logger.log(`Resolved → onlineMeetingId=${resolved.meetingId}, via userId=${userId}`);

    // Save the resolved online meeting ID
    await this.meetingModel.findByIdAndUpdate(meetingId, { onlineMeetingId: resolved.meetingId });

    // Step B: List transcripts
    const transcripts = await this.graphService.listMeetingTranscripts(accessToken, userId, resolved.meetingId);
    this.logger.log(`Found ${transcripts.length} transcript(s)`);

    if (transcripts.length === 0) {
      const errorMsg = 'Online meeting resolved but 0 transcripts found. Was "Start transcription" clicked during the meeting?';
      await this.meetingModel.findByIdAndUpdate(meetingId, { status: MeetingStatus.FAILED, errorMessage: errorMsg });
      throw new BadRequestException(errorMsg);
    }

    // Step C: Download transcript content (latest one)
    const latest = transcripts[transcripts.length - 1];
    const vttContent = await this.graphService.getTranscriptContent(
      accessToken, userId, resolved.meetingId, latest.id, 'text/vtt',
    );

    const parsed = this.graphService.parseVttTranscript(vttContent);
    if (!parsed.fullText) {
      throw new BadRequestException('Transcript was fetched but content is empty');
    }

    this.logger.log(`Transcript fetched: ${parsed.segments.length} segments, ${parsed.fullText.length} chars`);

    // Step D: Save transcript to DB
    const transcript = await this.transcriptsService.create({
      meetingId,
      fullText: parsed.fullText,
      segments: parsed.segments.map(s => ({
        start: s.start,
        end: s.end,
        text: s.text,
        speaker: s.speaker,
      })),
      language: 'en',
      duration: parsed.segments.length > 0 ? parsed.segments[parsed.segments.length - 1].end : 0,
      source: 'teams-native',
    });

    await this.meetingModel.findByIdAndUpdate(meetingId, {
      transcriptId: transcript._id,
      status: MeetingStatus.TRANSCRIPT_FETCHED,
      errorMessage: '',
    });

    this.logger.log(`Transcript saved for meeting ${meetingId}`);
    return this.findOne(meetingId);
  }

  /**
   * Fallback: List all online meetings for various users and match by joinUrl.
   * This bypasses the OData $filter which is known to be unreliable.
   */
  private async findOnlineMeetingByListing(
    accessToken: string,
    joinUrl: string,
    organizerEmail: string,
    targetUserId: string,
  ): Promise<{ meetingId: string; subject: string; resolvedViaUserId: string } | null> {
    const oidFromUrl = this.graphService.extractOidFromJoinUrl(joinUrl);
    const rawCandidates = new Set<string>();
    if (oidFromUrl) rawCandidates.add(oidFromUrl);
    if (organizerEmail) rawCandidates.add(organizerEmail);
    rawCandidates.add(targetUserId);

    // Resolve all candidates to Object IDs (GUIDs) — onlineMeetings requires OID, not UPN
    const resolvedOids = new Set<string>();
    for (const candidate of rawCandidates) {
      const oid = await this.graphService.resolveUserObjectId(accessToken, candidate);
      resolvedOids.add(oid);
    }

    const joinUrlBase = joinUrl.split('?')[0].toLowerCase();
    const joinUrlDecoded = decodeURIComponent(joinUrl).split('?')[0].toLowerCase();

    for (const uid of resolvedOids) {
      const meetings = await this.graphService.listAllOnlineMeetings(accessToken, uid);
      for (const m of meetings) {
        if (!m.joinWebUrl) continue;
        const graphBase = m.joinWebUrl.split('?')[0].toLowerCase();
        if (graphBase === joinUrlBase || graphBase === joinUrlDecoded) {
          this.logger.log(`Matched meeting by listing: ${m.id} via userId=${uid}`);
          return { meetingId: m.id, subject: m.subject, resolvedViaUserId: uid };
        }
      }
    }

    return null;
  }

  // ─── STEP 3: Summarize with OpenAI GPT-4o ───────────

  async summarize(meetingId: string): Promise<MeetingDocument> {
    const meeting = await this.findOne(meetingId);

    if (!meeting.transcriptId) {
      throw new BadRequestException(
        `Meeting "${meeting.subject}" has no transcript. Fetch the transcript first (POST /meetings/${meetingId}/fetch-transcript).`,
      );
    }

    // Get transcript text
    const transcript = await this.transcriptsService.findOne(meeting.transcriptId.toString());
    if (!transcript || !transcript.fullText) {
      throw new BadRequestException('Transcript exists but has no text content');
    }

    this.logger.log(`Summarizing meeting "${meeting.subject}" (${transcript.fullText.length} chars)...`);

    const startTime = Date.now();

    try {
      const analysis = await this.aiProvider.analyzeTranscript(transcript.fullText, meeting.subject);
      const processingTimeMs = Date.now() - startTime;

      const summary = await this.summariesService.create({
        meetingId,
        transcriptId: transcript._id.toString(),
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        actionItems: analysis.actionItems,
        decisions: analysis.decisions,
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        processingTimeMs,
      });

      await this.meetingModel.findByIdAndUpdate(meetingId, {
        summaryId: summary._id,
        status: MeetingStatus.SUMMARIZED,
        errorMessage: '',
      });

      this.logger.log(`Summary saved for meeting ${meetingId} (took ${processingTimeMs}ms)`);
      return this.findOne(meetingId);
    } catch (err: any) {
      const errorMsg = `OpenAI summarization failed: ${err.message}`;
      await this.meetingModel.findByIdAndUpdate(meetingId, { status: MeetingStatus.FAILED, errorMessage: errorMsg });
      throw new InternalServerErrorException(errorMsg);
    }
  }
}
