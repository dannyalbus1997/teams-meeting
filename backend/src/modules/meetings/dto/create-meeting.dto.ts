import { IsString, IsArray, IsDate, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting subject/title' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Meeting start time' })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ description: 'Meeting end time' })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiPropertyOptional({ description: 'Organizer display name' })
  @IsString()
  @IsOptional()
  organizerName?: string;

  @ApiPropertyOptional({ description: 'Organizer email / UPN' })
  @IsString()
  @IsOptional()
  organizerEmail?: string;

  @ApiPropertyOptional({ description: 'Attendee names or emails', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendees?: string[];

  @ApiPropertyOptional({ description: 'Teams meeting join URL' })
  @IsString()
  @IsOptional()
  joinUrl?: string;

  @ApiPropertyOptional({ description: 'Calendar event ID from Graph API' })
  @IsString()
  @IsOptional()
  calendarEventId?: string;
}
