import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MeetingDocument = Meeting & Document;

export enum MeetingStatus {
  SYNCED = 'synced',
  TRANSCRIPT_FETCHED = 'transcript_fetched',
  SUMMARIZED = 'summarized',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Meeting {
  @ApiProperty()
  @Prop({ required: true })
  subject: string;

  @ApiProperty()
  @Prop({ required: true })
  startTime: Date;

  @ApiProperty()
  @Prop({ required: true })
  endTime: Date;

  @ApiProperty()
  @Prop()
  organizerName: string;

  @ApiProperty()
  @Prop()
  organizerEmail: string;

  @ApiProperty()
  @Prop({ type: [String] })
  attendees: string[];

  @ApiProperty()
  @Prop()
  joinUrl: string;

  @ApiProperty()
  @Prop()
  onlineMeetingId: string;

  @ApiProperty()
  @Prop()
  calendarEventId: string;

  @ApiProperty({ enum: MeetingStatus })
  @Prop({ type: String, enum: MeetingStatus, default: MeetingStatus.SYNCED })
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
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.index({ calendarEventId: 1 }, { unique: true, sparse: true });
MeetingSchema.index({ startTime: -1 });
