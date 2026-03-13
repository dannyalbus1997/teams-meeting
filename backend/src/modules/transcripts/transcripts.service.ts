import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transcript, TranscriptDocument } from './schemas/transcript.schema';
import { CreateTranscriptDto } from './dto/create-transcript.dto';

@Injectable()
export class TranscriptsService {
  constructor(
    @InjectModel(Transcript.name) private transcriptModel: Model<TranscriptDocument>,
  ) {}

  async create(createTranscriptDto: CreateTranscriptDto): Promise<TranscriptDocument> {
    // Validate meetingId format
    if (!Types.ObjectId.isValid(createTranscriptDto.meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    // Calculate word count from full text
    const wordCount = createTranscriptDto.fullText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    const transcript = new this.transcriptModel({
      meetingId: new Types.ObjectId(createTranscriptDto.meetingId),
      fullText: createTranscriptDto.fullText,
      segments: createTranscriptDto.segments,
      language: createTranscriptDto.language,
      duration: createTranscriptDto.duration,
      source: createTranscriptDto.source || 'manual',
      wordCount,
    });

    return transcript.save();
  }

  async findAll(): Promise<TranscriptDocument[]> {
    return this.transcriptModel.find().exec();
  }

  async findByMeetingId(meetingId: string): Promise<TranscriptDocument[]> {
    if (!Types.ObjectId.isValid(meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    return this.transcriptModel.find({ meetingId: new Types.ObjectId(meetingId) }).exec();
  }

  async findOne(id: string): Promise<TranscriptDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript ID format');
    }

    const transcript = await this.transcriptModel.findById(id).exec();

    if (!transcript) {
      throw new NotFoundException(`Transcript with ID ${id} not found`);
    }

    return transcript;
  }

  async update(id: string, updateTranscriptDto: Partial<CreateTranscriptDto>): Promise<TranscriptDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript ID format');
    }

    const updateData: any = { ...updateTranscriptDto };

    // Recalculate wordCount if fullText is being updated
    if (updateTranscriptDto.fullText) {
      updateData.wordCount = updateTranscriptDto.fullText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
    }

    // Validate meetingId if being updated
    if (updateTranscriptDto.meetingId && !Types.ObjectId.isValid(updateTranscriptDto.meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    if (updateTranscriptDto.meetingId) {
      updateData.meetingId = new Types.ObjectId(updateTranscriptDto.meetingId);
    }

    const transcript = await this.transcriptModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!transcript) {
      throw new NotFoundException(`Transcript with ID ${id} not found`);
    }

    return transcript;
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript ID format');
    }

    const result = await this.transcriptModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Transcript with ID ${id} not found`);
    }
  }
}
