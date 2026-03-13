import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Summary, SummaryDocument } from './schemas/summary.schema';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';

@Injectable()
export class SummariesService {
  constructor(
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
  ) {}

  async create(createSummaryDto: CreateSummaryDto): Promise<SummaryDocument> {
    // Validate IDs format
    if (!Types.ObjectId.isValid(createSummaryDto.meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    if (!Types.ObjectId.isValid(createSummaryDto.transcriptId)) {
      throw new BadRequestException('Invalid transcriptId format');
    }

    const summary = new this.summaryModel({
      meetingId: new Types.ObjectId(createSummaryDto.meetingId),
      transcriptId: new Types.ObjectId(createSummaryDto.transcriptId),
      summary: createSummaryDto.summary,
      keyPoints: createSummaryDto.keyPoints || [],
      actionItems: createSummaryDto.actionItems || [],
      decisions: createSummaryDto.decisions || [],
      topics: createSummaryDto.topics || [],
      sentiment: createSummaryDto.sentiment,
      aiProvider: createSummaryDto.aiProvider || 'auto',
      modelUsed: createSummaryDto.modelUsed,
      processingTimeMs: createSummaryDto.processingTimeMs,
    });

    return summary.save();
  }

  async findAll(): Promise<SummaryDocument[]> {
    return this.summaryModel.find().exec();
  }

  async findByMeetingId(meetingId: string): Promise<SummaryDocument[]> {
    if (!Types.ObjectId.isValid(meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    return this.summaryModel.find({ meetingId: new Types.ObjectId(meetingId) }).exec();
  }

  async findOne(id: string): Promise<SummaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid summary ID format');
    }

    const summary = await this.summaryModel.findById(id).exec();

    if (!summary) {
      throw new NotFoundException(`Summary with ID ${id} not found`);
    }

    return summary;
  }

  async update(id: string, updateSummaryDto: Partial<CreateSummaryDto>): Promise<SummaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid summary ID format');
    }

    const updateData: any = { ...updateSummaryDto };

    // Validate IDs if being updated
    if (updateSummaryDto.meetingId && !Types.ObjectId.isValid(updateSummaryDto.meetingId)) {
      throw new BadRequestException('Invalid meetingId format');
    }

    if (updateSummaryDto.transcriptId && !Types.ObjectId.isValid(updateSummaryDto.transcriptId)) {
      throw new BadRequestException('Invalid transcriptId format');
    }

    if (updateSummaryDto.meetingId) {
      updateData.meetingId = new Types.ObjectId(updateSummaryDto.meetingId);
    }

    if (updateSummaryDto.transcriptId) {
      updateData.transcriptId = new Types.ObjectId(updateSummaryDto.transcriptId);
    }

    const summary = await this.summaryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!summary) {
      throw new NotFoundException(`Summary with ID ${id} not found`);
    }

    return summary;
  }

  async toggleActionItem(
    id: string,
    updateActionItemDto: UpdateActionItemDto,
  ): Promise<SummaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid summary ID format');
    }

    const summary = await this.summaryModel.findById(id).exec();

    if (!summary) {
      throw new NotFoundException(`Summary with ID ${id} not found`);
    }

    const { actionItemIndex, completed } = updateActionItemDto;

    if (actionItemIndex < 0 || actionItemIndex >= summary.actionItems.length) {
      throw new BadRequestException(
        `Invalid actionItemIndex: ${actionItemIndex}. Summary has ${summary.actionItems.length} action items.`,
      );
    }

    summary.actionItems[actionItemIndex].completed = completed;
    return summary.save();
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid summary ID format');
    }

    const result = await this.summaryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Summary with ID ${id} not found`);
    }
  }
}
