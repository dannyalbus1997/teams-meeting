import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TranscriptDocument = Transcript & Document;

@Schema()
export class TranscriptSegment {
  @Prop({ required: true })
  start: number;

  @Prop({ required: true })
  end: number;

  @Prop({ required: true })
  text: string;

  @Prop()
  speaker: string;

  @Prop()
  confidence: number;
}

export const TranscriptSegmentSchema = SchemaFactory.createForClass(TranscriptSegment);

@Schema({ timestamps: true })
export class Transcript {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true })
  meetingId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  fullText: string;

  @ApiProperty()
  @Prop({ type: [TranscriptSegmentSchema] })
  segments: TranscriptSegment[];

  @ApiProperty()
  @Prop()
  language: string;

  @ApiProperty()
  @Prop()
  duration: number;

  @ApiProperty()
  @Prop({ default: 'whisper' })
  source: string; // 'whisper', 'teams-native', 'manual'

  @ApiProperty()
  @Prop()
  storageKey: string;

  @ApiProperty()
  @Prop()
  wordCount: number;
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);

TranscriptSchema.index({ meetingId: 1 });
