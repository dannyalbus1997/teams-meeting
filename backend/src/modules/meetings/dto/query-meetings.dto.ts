import { IsOptional, IsEnum, IsDateString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MeetingStatus } from '../schemas/meeting.schema';

export class QueryMeetingsDto {
  @ApiPropertyOptional({
    description: 'Filter by meeting status',
    enum: MeetingStatus,
    example: MeetingStatus.COMPLETED,
  })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @ApiPropertyOptional({
    description: 'Filter meetings starting from this date (ISO 8601 format)',
    example: '2026-03-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter meetings up to this date (ISO 8601 format)',
    example: '2026-03-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-indexed)',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
