import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './schemas/meeting.schema';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingSyncService } from './meetings-sync.service';
import { TranscriptsModule } from '../transcripts/transcripts.module';
import { SummariesModule } from '../summaries/summaries.module';
import { SpeechModule } from '../speech/speech.module';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    forwardRef(() => TranscriptsModule),
    forwardRef(() => SummariesModule),
    forwardRef(() => SpeechModule),
    forwardRef(() => AiModule),
    forwardRef(() => StorageModule),
    GraphModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingSyncService],
  exports: [MeetingsService, MeetingSyncService],
})
export class MeetingsModule {}
