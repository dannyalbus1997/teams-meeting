import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { Meeting, MeetingDocument, MeetingStatus } from './schemas/meeting.schema';
import {
  SpeechProvider,
  SPEECH_PROVIDER,
  AiProvider,
  AI_PROVIDER,
  StorageProvider,
  STORAGE_PROVIDER,
} from '../../common/interfaces';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { SummariesService } from '../summaries/summaries.service';
import { GraphService } from '../graph/graph.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    @Inject(SPEECH_PROVIDER) private speechProvider: SpeechProvider,
    @Inject(AI_PROVIDER) private aiProvider: AiProvider,
    @Inject(STORAGE_PROVIDER) private storageProvider: StorageProvider,
    private transcriptsService: TranscriptsService,
    private summariesService: SummariesService,
    private graphService: GraphService,
    private authService: AuthService,
  ) {}

  async create(createMeetingDto: CreateMeetingDto): Promise<MeetingDocument> {
    try {
      const existingMeeting = await this.meetingModel.findOne({
        teamsEventId: createMeetingDto.teamsEventId,
      });

      if (existingMeeting) {
        return existingMeeting; // Return existing instead of throwing
      }

      const meeting = new this.meetingModel(createMeetingDto);
      meeting.status = MeetingStatus.DETECTED;
      return await meeting.save();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Failed to create meeting: ${error.message}`);
    }
  }

  async findAll(
    query: QueryMeetingsDto,
  ): Promise<{ data: MeetingDocument[]; total: number; page: number; limit: number }> {
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
    if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException(`Invalid meeting ID: ${id}`);
    }
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) throw new NotFoundException(`Meeting with ID ${id} not found`);
    return meeting;
  }

  async findByTeamsEventId(teamsEventId: string): Promise<MeetingDocument | null> {
    return this.meetingModel.findOne({ teamsEventId }).exec();
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto): Promise<MeetingDocument> {
    const meeting = await this.meetingModel.findByIdAndUpdate(id, updateMeetingDto, {
      new: true,
      runValidators: true,
    });
    if (!meeting) throw new NotFoundException(`Meeting with ID ${id} not found`);
    return meeting;
  }

  async updateStatus(
    id: string,
    status: MeetingStatus,
    errorMessage?: string,
  ): Promise<MeetingDocument> {
    const updateData: any = { status };
    if (errorMessage) updateData.errorMessage = errorMessage;

    const meeting = await this.meetingModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!meeting) throw new NotFoundException(`Meeting with ID ${id} not found`);
    return meeting;
  }

  /**
   * Process meeting using a transcript that was already fetched
   * (e.g. native Teams transcript via Graph API)
   */
  async processWithTranscriptText(
    id: string,
    fullText: string,
    segments: Array<{ start: number; end: number; text: string; speaker?: string }>,
    source: string = 'teams-native',
  ): Promise<MeetingDocument> {
    let meeting: MeetingDocument | null = null;

    try {
      meeting = await this.findOne(id);
      await this.updateStatus(id, MeetingStatus.TRANSCRIBING);

      // Save the transcript
      const transcript = await this.transcriptsService.create({
        meetingId: id,
        fullText,
        segments: segments.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
          speaker: s.speaker,
        })),
        language: 'en',
        duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
        source,
      });

      await this.meetingModel.findByIdAndUpdate(id, { transcriptId: transcript._id });
      await this.updateStatus(id, MeetingStatus.TRANSCRIBED);

      // Run AI analysis
      await this.updateStatus(id, MeetingStatus.ANALYZING);
      this.logger.log(`Analyzing transcript for meeting ${id}...`);

      const startTime = Date.now();
      const analysis = await this.aiProvider.analyzeTranscript(fullText, meeting.subject);
      const processingTimeMs = Date.now() - startTime;

      const summary = await this.summariesService.create({
        meetingId: id,
        transcriptId: transcript._id.toString(),
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        actionItems: analysis.actionItems,
        decisions: analysis.decisions,
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        processingTimeMs,
      });

      await this.meetingModel.findByIdAndUpdate(id, { summaryId: summary._id });
      await this.updateStatus(id, MeetingStatus.COMPLETED);

      this.logger.log(`Meeting ${id} fully processed in ${processingTimeMs}ms`);
      return await this.findOne(id);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      this.logger.error(`Failed to process meeting ${id}: ${errorMsg}`);
      if (meeting) await this.updateStatus(id, MeetingStatus.FAILED, errorMsg);
      throw new InternalServerErrorException(`Failed to process meeting: ${errorMsg}`);
    }
  }

  /**
   * Process meeting by first running speech-to-text on a recording buffer,
   * then running AI analysis.
   */
  async processWithRecording(id: string, audioBuffer: Buffer): Promise<MeetingDocument> {
    let meeting: MeetingDocument | null = null;

    try {
      meeting = await this.findOne(id);

      // Store the recording
      const storageKey = `recordings/${id}.webm`;
      await this.storageProvider.upload(storageKey, audioBuffer, 'audio/webm');
      await this.meetingModel.findByIdAndUpdate(id, {
        recordingStorageKey: storageKey,
        status: MeetingStatus.RECORDING_AVAILABLE,
      });

      // Run speech-to-text
      await this.updateStatus(id, MeetingStatus.TRANSCRIBING);
      this.logger.log(`Transcribing recording for meeting ${id}...`);

      const transcriptionResult = await this.speechProvider.transcribe(audioBuffer, {
        language: 'en',
        format: 'verbose_json',
      });

      // Continue with transcript text
      return await this.processWithTranscriptText(
        id,
        transcriptionResult.text,
        transcriptionResult.segments,
        'whisper',
      );
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      this.logger.error(`Failed to process recording for meeting ${id}: ${errorMsg}`);
      if (meeting) await this.updateStatus(id, MeetingStatus.FAILED, errorMsg);
      throw new InternalServerErrorException(`Failed to process recording: ${errorMsg}`);
    }
  }

  /**
   * Process a meeting: tries existing transcript → Graph API transcript → stored recording.
   * Uses app-level (client credentials) permissions to fetch from Graph API automatically.
   */
  async processMeeting(id: string): Promise<MeetingDocument> {
    const meeting = await this.findOne(id);

    // ── Option 1: Use existing transcript in DB ──
    if (meeting.transcriptId) {
      try {
        const existingTranscript = await this.transcriptsService.findOne(
          meeting.transcriptId.toString(),
        );

        if (existingTranscript && existingTranscript.fullText) {
          this.logger.log(`Processing meeting ${id} using existing transcript`);
          return this.runAiAnalysis(id, existingTranscript.fullText, existingTranscript._id.toString(), meeting.subject);
        }
      } catch (error: any) {
        this.logger.warn(`Failed to use existing transcript for ${id}: ${error.message}`);
      }
    }

    // ── Option 2: Fetch transcript from Graph API (app-level permissions) ──
    if (this.authService.isConfigured() && meeting.joinUrl) {
      this.logger.log(`Trying to fetch transcript from Graph API for meeting ${id}...`);
      try {
        const tokens = await this.authService.getAppAccessToken();
        const accessToken = tokens.accessToken;
        const userId = this.authService.getTargetUserId();

        const onlineMeeting = await this.graphService.getOnlineMeetingByJoinUrl(
          accessToken,
          userId,
          meeting.joinUrl,
        );

        if (onlineMeeting) {
          const transcripts = await this.graphService.listMeetingTranscripts(
            accessToken,
            userId,
            onlineMeeting.meetingId,
          );

          if (transcripts.length > 0) {
            const latestTranscript = transcripts[transcripts.length - 1];
            const vttContent = await this.graphService.getTranscriptContent(
              accessToken,
              userId,
              onlineMeeting.meetingId,
              latestTranscript.id,
              'text/vtt',
            );

            const parsed = this.graphService.parseVttTranscript(vttContent);

            if (parsed.fullText.length > 0) {
              this.logger.log(`Fetched transcript from Graph API (${parsed.segments.length} segments)`);
              return this.processWithTranscriptText(id, parsed.fullText, parsed.segments, 'teams-native');
            }
          }

          // Try recordings if no transcript
          const recordings = await this.graphService.listMeetingRecordings(
            accessToken,
            userId,
            onlineMeeting.meetingId,
          );

          if (recordings.length > 0) {
            const latestRecording = recordings[recordings.length - 1];
            const audioBuffer = await this.graphService.getRecordingContent(
              accessToken,
              userId,
              onlineMeeting.meetingId,
              latestRecording.id,
            );

            this.logger.log(`Fetched recording from Graph API, processing...`);
            return this.processWithRecording(id, audioBuffer);
          }
        }

        this.logger.warn(`No transcript or recording found on Graph API for meeting ${id}`);
      } catch (error: any) {
        this.logger.error(`Graph API fetch failed for meeting ${id}: ${error.message}`);
      }
    }

    // ── Option 3: Process from stored recording ──
    if (meeting.recordingStorageKey) {
      const recordingBuffer = await this.storageProvider.download(meeting.recordingStorageKey);
      return this.processWithRecording(id, recordingBuffer);
    }

    throw new BadRequestException(
      'No transcript or recording available for this meeting. ' +
      'Make sure transcription is enabled in Teams settings, then try syncing again.',
    );
  }

  /**
   * Run AI analysis on transcript text and save the summary.
   */
  private async runAiAnalysis(
    meetingId: string,
    fullText: string,
    transcriptId: string,
    subject: string,
  ): Promise<MeetingDocument> {
    await this.updateStatus(meetingId, MeetingStatus.ANALYZING);

    const startTime = Date.now();
    const analysis = await this.aiProvider.analyzeTranscript(fullText, subject);
    const processingTimeMs = Date.now() - startTime;

    const summary = await this.summariesService.create({
      meetingId,
      transcriptId,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      actionItems: analysis.actionItems,
      decisions: analysis.decisions,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      processingTimeMs,
    });

    await this.meetingModel.findByIdAndUpdate(meetingId, { summaryId: summary._id });
    await this.updateStatus(meetingId, MeetingStatus.COMPLETED);

    this.logger.log(`Meeting ${meetingId} AI analysis completed in ${processingTimeMs}ms`);
    return await this.findOne(meetingId);
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    processing: number;
  }> {
    const [total, completed, failed, processing] = await Promise.all([
      this.meetingModel.countDocuments(),
      this.meetingModel.countDocuments({ status: MeetingStatus.COMPLETED }),
      this.meetingModel.countDocuments({ status: MeetingStatus.FAILED }),
      this.meetingModel.countDocuments({
        status: { $in: [MeetingStatus.TRANSCRIBING, MeetingStatus.ANALYZING] },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      processing,
      pending: total - completed - failed - processing,
    };
  }

  /**
   * Save or update a partial transcript for a live meeting.
   * Does NOT trigger AI analysis — that happens after the meeting ends.
   * This allows users to see the live transcript in the dashboard.
   */
  async savePartialTranscript(
    id: string,
    fullText: string,
    segments: Array<{ start: number; end: number; text: string; speaker?: string }>,
    source: string = 'teams-native-live',
  ): Promise<MeetingDocument> {
    try {
      const meeting = await this.findOne(id);

      // Check if we already have a transcript for this meeting
      if (meeting.transcriptId) {
        // Update the existing transcript with new content
        const existingTranscript = await this.transcriptsService.findOne(
          meeting.transcriptId.toString(),
        );

        if (existingTranscript) {
          await this.transcriptsService.update(existingTranscript._id.toString(), {
            fullText,
            segments: segments.map((s) => ({
              start: s.start,
              end: s.end,
              text: s.text,
              speaker: s.speaker,
            })),
            duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
            source,
          });

          this.logger.log(`Live transcript updated for meeting ${id} (${segments.length} segments)`);
          return meeting;
        }
      }

      // Create new transcript
      const transcript = await this.transcriptsService.create({
        meetingId: id,
        fullText,
        segments: segments.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
          speaker: s.speaker,
        })),
        language: 'en',
        duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
        source,
      });

      await this.meetingModel.findByIdAndUpdate(id, { transcriptId: transcript._id });

      this.logger.log(`Live transcript created for meeting ${id} (${segments.length} segments)`);
      return await this.findOne(id);
    } catch (error: any) {
      this.logger.error(`Failed to save partial transcript for meeting ${id}: ${error.message}`);
      return await this.findOne(id);
    }
  }
}
