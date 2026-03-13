import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MeetingDocument = Meeting & Document;

export enum MeetingStatus {
  DETECTED = 'detected',
  RECORDING_AVAILABLE = 'recording_available',
  TRANSCRIBING = 'transcribing',
  TRANSCRIBED = 'transcribed',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Meeting {
  @ApiProperty()
  @Prop({ required: true })
  teamsEventId: string;

  @ApiProperty()
  @Prop({ required: true })
  subject: string;

  @ApiProperty()
  @Prop()
  organizer: string;

  @ApiProperty()
  @Prop({ type: [String] })
  participants: string[];

  @ApiProperty()
  @Prop({ required: true })
  startTime: Date;

  @ApiProperty()
  @Prop()
  endTime: Date;

  @ApiProperty()
  @Prop()
  duration: number; // in seconds

  @ApiProperty()
  @Prop()
  joinUrl: string;

  @ApiProperty()
  @Prop()
  recordingUrl: string;

  @ApiProperty()
  @Prop()
  recordingStorageKey: string;

  @ApiProperty({ enum: MeetingStatus })
  @Prop({ type: String, enum: MeetingStatus, default: MeetingStatus.DETECTED })
  status: MeetingStatus;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Transcript' })
  transcriptId: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Summary' })
  summaryId: Types.ObjectId;

  @ApiProperty()
  @Prop()
  errorMessage: string;

  @ApiProperty()
  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.index({ teamsEventId: 1 }, { unique: true });
MeetingSchema.index({ startTime: -1 });
MeetingSchema.index({ status: 1 });
