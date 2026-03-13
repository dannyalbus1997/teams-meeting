import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TranscriptSegmentDto {
  @ApiProperty({ description: 'Start time in seconds' })
  @IsNumber()
  start: number;

  @ApiProperty({ description: 'End time in seconds' })
  @IsNumber()
  end: number;

  @ApiProperty({ description: 'Segment text content' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Speaker name or identifier' })
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional({ description: 'Confidence score (0-1)' })
  @IsOptional()
  @IsNumber()
  confidence?: number;
}

export class CreateTranscriptDto {
  @ApiProperty({ description: 'Meeting ID' })
  @IsString()
  meetingId: string;

  @ApiProperty({ description: 'Full transcript text' })
  @IsString()
  fullText: string;

  @ApiProperty({ description: 'Transcript segments', isArray: true, type: TranscriptSegmentDto })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptSegmentDto)
  segments: TranscriptSegmentDto[];

  @ApiPropertyOptional({ description: 'Language code (e.g., en-US)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Transcript source (whisper, teams-native, manual)' })
  @IsOptional()
  @IsString()
  source?: string;
}
