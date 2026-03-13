import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SummariesService } from './summaries.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { SummaryDocument } from './schemas/summary.schema';

@ApiTags('summaries')
@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new summary' })
  @ApiBody({ type: CreateSummaryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Summary created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createSummaryDto: CreateSummaryDto): Promise<SummaryDocument> {
    return this.summariesService.create(createSummaryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all summaries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all summaries',
    isArray: true,
  })
  async findAll(): Promise<SummaryDocument[]> {
    return this.summariesService.findAll();
  }

  @Get('meeting/:meetingId')
  @ApiOperation({ summary: 'Get summaries by meeting ID' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of summaries for the meeting',
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid meetingId format',
  })
  async findByMeetingId(@Param('meetingId') meetingId: string): Promise<SummaryDocument[]> {
    return this.summariesService.findByMeetingId(meetingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a summary by ID' })
  @ApiParam({ name: 'id', description: 'Summary ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Summary not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid summary ID format',
  })
  async findOne(@Param('id') id: string): Promise<SummaryDocument> {
    return this.summariesService.findOne(id);
  }

  @Patch(':id/action-items')
  @ApiOperation({ summary: 'Toggle action item completion status' })
  @ApiParam({ name: 'id', description: 'Summary ID', type: String })
  @ApiBody({ type: UpdateActionItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Action item status updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Summary not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async toggleActionItem(
    @Param('id') id: string,
    @Body() updateActionItemDto: UpdateActionItemDto,
  ): Promise<SummaryDocument> {
    return this.summariesService.toggleActionItem(id, updateActionItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a summary' })
  @ApiParam({ name: 'id', description: 'Summary ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Summary not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid summary ID format',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.summariesService.delete(id);
    return { message: 'Summary deleted successfully' };
  }
}
