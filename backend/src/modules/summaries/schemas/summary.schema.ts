import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SummaryDocument = Summary & Document;

@Schema()
export class ActionItem {
  @Prop({ required: true })
  assignee: string;

  @Prop({ required: true })
  task: string;

  @Prop()
  deadline: string;

  @Prop({ type: String, enum: ['high', 'medium', 'low'] })
  priority: string;

  @Prop({ default: false })
  completed: boolean;
}

export const ActionItemSchema = SchemaFactory.createForClass(ActionItem);

@Schema({ timestamps: true })
export class Summary {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true })
  meetingId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Transcript', required: true })
  transcriptId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  summary: string;

  @ApiProperty()
  @Prop({ type: [String] })
  keyPoints: string[];

  @ApiProperty()
  @Prop({ type: [ActionItemSchema] })
  actionItems: ActionItem[];

  @ApiProperty()
  @Prop({ type: [String] })
  decisions: string[];

  @ApiProperty()
  @Prop({ type: [String] })
  topics: string[];

  @ApiProperty()
  @Prop()
  sentiment: string;

  @ApiProperty()
  @Prop({ default: 'auto' })
  aiProvider: string;

  @ApiProperty()
  @Prop()
  modelUsed: string;

  @ApiProperty()
  @Prop()
  processingTimeMs: number;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);

SummarySchema.index({ meetingId: 1 });
