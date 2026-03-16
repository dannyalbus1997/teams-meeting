import { IsOptional, IsEnum, IsDateString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MeetingStatus } from '../schemas/meeting.schema';

export class QueryMeetingsDto {
  @ApiPropertyOptional({ enum: MeetingStatus })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @ApiPropertyOptional({ description: 'Filter from this date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter up to this date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
