import { Document, Types } from 'mongoose';
export type MeetingDocument = Meeting & Document;
export declare enum MeetingStatus {
    DETECTED = "detected",
    LIVE = "live",
    RECORDING_AVAILABLE = "recording_available",
    TRANSCRIBING = "transcribing",
    TRANSCRIBED = "transcribed",
    ANALYZING = "analyzing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Meeting {
    teamsEventId: string;
    subject: string;
    organizer: string;
    participants: string[];
    startTime: Date;
    endTime: Date;
    duration: number;
    joinUrl: string;
    recordingUrl: string;
    recordingStorageKey: string;
    status: MeetingStatus;
    transcriptId: Types.ObjectId;
    summaryId: Types.ObjectId;
    errorMessage: string;
    metadata: Record<string, any>;
}
export declare const MeetingSchema: import("mongoose").Schema<Meeting, import("mongoose").Model<Meeting, any, any, any, Document<unknown, any, Meeting, any, {}> & Meeting & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Meeting, Document<unknown, {}, import("mongoose").FlatRecord<Meeting>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Meeting> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
