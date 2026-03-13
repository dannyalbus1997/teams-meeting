import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActionItemDto {
  @ApiProperty({ description: 'Assignee name' })
  @IsString()
  assignee: string;

  @ApiProperty({ description: 'Task description' })
  @IsString()
  task: string;

  @ApiPropertyOptional({ description: 'Task deadline' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: ['high', 'medium', 'low'],
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';
}

export class CreateSummaryDto {
  @ApiProperty({ description: 'Meeting ID' })
  @IsString()
  meetingId: string;

  @ApiProperty({ description: 'Transcript ID' })
  @IsString()
  transcriptId: string;

  @ApiProperty({ description: 'Summary text' })
  @IsString()
  summary: string;

  @ApiPropertyOptional({ description: 'Key points', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @ApiPropertyOptional({
    description: 'Action items',
    isArray: true,
    type: ActionItemDto,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  actionItems?: ActionItemDto[];

  @ApiPropertyOptional({ description: 'Decisions made', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  decisions?: string[];

  @ApiPropertyOptional({ description: 'Meeting topics', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @ApiPropertyOptional({ description: 'Overall sentiment (positive, neutral, negative)' })
  @IsOptional()
  @IsString()
  sentiment?: string;

  @ApiPropertyOptional({ description: 'AI provider used for summarization' })
  @IsOptional()
  @IsString()
  aiProvider?: string;

  @ApiPropertyOptional({ description: 'AI model used' })
  @IsOptional()
  @IsString()
  modelUsed?: string;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  @IsOptional()
  @IsNumber()
  processingTimeMs?: number;
}
