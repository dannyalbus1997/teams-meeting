"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const meetings_module_1 = require("./modules/meetings/meetings.module");
const transcripts_module_1 = require("./modules/transcripts/transcripts.module");
const summaries_module_1 = require("./modules/summaries/summaries.module");
const auth_module_1 = require("./modules/auth/auth.module");
const graph_module_1 = require("./modules/graph/graph.module");
const speech_module_1 = require("./modules/speech/speech.module");
const ai_module_1 = require("./modules/ai/ai.module");
const storage_module_1 = require("./modules/storage/storage.module");
const configuration_1 = require("./config/configuration");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    uri: configService.get('mongodb.uri'),
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            graph_module_1.GraphModule,
            speech_module_1.SpeechModule,
            ai_module_1.AiModule,
            storage_module_1.StorageModule,
            meetings_module_1.MeetingsModule,
            transcripts_module_1.TranscriptsModule,
            summaries_module_1.SummariesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map