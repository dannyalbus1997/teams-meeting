import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from '../meetings/schemas/meeting.schema';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { MeetingsModule } from '../meetings/meetings.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    forwardRef(() => MeetingsModule),
    GraphModule,
  ],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
