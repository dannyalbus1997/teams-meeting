import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transcript, TranscriptSchema } from './schemas/transcript.schema';
import { TranscriptsService } from './transcripts.service';
import { TranscriptsController } from './transcripts.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transcript.name, schema: TranscriptSchema }])],
  controllers: [TranscriptsController],
  providers: [TranscriptsService],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}
