import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './schemas/meeting.schema';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { TranscriptsModule } from '../transcripts/transcripts.module';
import { SummariesModule } from '../summaries/summaries.module';
import { GraphModule } from '../graph/graph.module';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    TranscriptsModule,
    SummariesModule,
    GraphModule,
    AuthModule,
    AiModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
