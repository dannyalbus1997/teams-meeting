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
   * Legacy: process meeting from an already-stored recording
   */
  async processMeeting(id: string): Promise<MeetingDocument> {
    const meeting = await this.findOne(id);

    if (!meeting.recordingStorageKey) {
      throw new BadRequestException('Recording is not available for this meeting');
    }

    const recordingBuffer = await this.storageProvider.download(meeting.recordingStorageKey);
    return this.processWithRecording(id, recordingBuffer);
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
}
