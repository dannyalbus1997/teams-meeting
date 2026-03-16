import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { TranscriptsModule } from './modules/transcripts/transcripts.module';
import { SummariesModule } from './modules/summaries/summaries.module';
import { AuthModule } from './modules/auth/auth.module';
import { GraphModule } from './modules/graph/graph.module';
import { AiModule } from './modules/ai/ai.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    GraphModule,
    AiModule,
    MeetingsModule,
    TranscriptsModule,
    SummariesModule,
  ],
})
export class AppModule {}
