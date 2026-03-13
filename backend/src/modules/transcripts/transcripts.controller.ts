import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TranscriptsService } from './transcripts.service';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { TranscriptDocument } from './schemas/transcript.schema';

@ApiTags('transcripts')
@Controller('transcripts')
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transcript' })
  @ApiBody({ type: CreateTranscriptDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transcript created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createTranscriptDto: CreateTranscriptDto): Promise<TranscriptDocument> {
    return this.transcriptsService.create(createTranscriptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transcripts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all transcripts',
    isArray: true,
  })
  async findAll(): Promise<TranscriptDocument[]> {
    return this.transcriptsService.findAll();
  }

  @Get('meeting/:meetingId')
  @ApiOperation({ summary: 'Get transcripts by meeting ID' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transcripts for the meeting',
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid meetingId format',
  })
  async findByMeetingId(@Param('meetingId') meetingId: string): Promise<TranscriptDocument[]> {
    return this.transcriptsService.findByMeetingId(meetingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transcript by ID' })
  @ApiParam({ name: 'id', description: 'Transcript ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transcript found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transcript not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transcript ID format',
  })
  async findOne(@Param('id') id: string): Promise<TranscriptDocument> {
    return this.transcriptsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transcript' })
  @ApiParam({ name: 'id', description: 'Transcript ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transcript deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transcript not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transcript ID format',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.transcriptsService.delete(id);
    return { message: 'Transcript deleted successfully' };
  }
}
