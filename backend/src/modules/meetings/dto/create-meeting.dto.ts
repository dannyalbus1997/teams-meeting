import { IsString, IsArray, IsDate, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @ApiProperty({
    description: 'The Teams event ID from Microsoft Teams',
    example: 'AAMkADc3NTRlZjkz...',
  })
  @IsString()
  teamsEventId: string;

  @ApiProperty({
    description: 'Meeting subject/title',
    example: 'Q1 Planning Meeting',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description: 'Meeting organizer name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  organizer?: string;

  @ApiPropertyOptional({
    description: 'List of participant email addresses or names',
    type: [String],
    example: ['jane@example.com', 'bob@example.com'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[];

  @ApiProperty({
    description: 'Meeting start time',
    example: '2026-03-15T10:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiPropertyOptional({
    description: 'Meeting end time',
    example: '2026-03-15T11:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({
    description: 'Teams meeting join URL',
    example: 'https://teams.microsoft.com/l/meetup-join/19:...',
  })
  @IsUrl()
  @IsOptional()
  joinUrl?: string;
}
