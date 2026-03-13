import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Summary, SummarySchema } from './schemas/summary.schema';
import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Summary.name, schema: SummarySchema }])],
  controllers: [SummariesController],
  providers: [SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
