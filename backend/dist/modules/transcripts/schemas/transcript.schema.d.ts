import { Document, Types } from 'mongoose';
export type TranscriptDocument = Transcript & Document;
export declare class TranscriptSegment {
    start: number;
    end: number;
    text: string;
    speaker: string;
    confidence: number;
}
export declare const TranscriptSegmentSchema: import("mongoose").Schema<TranscriptSegment, import("mongoose").Model<TranscriptSegment, any, any, any, Document<unknown, any, TranscriptSegment, any, {}> & TranscriptSegment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TranscriptSegment, Document<unknown, {}, import("mongoose").FlatRecord<TranscriptSegment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<TranscriptSegment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Transcript {
    meetingId: Types.ObjectId;
    fullText: string;
    segments: TranscriptSegment[];
    language: string;
    duration: number;
    source: string;
    storageKey: string;
    wordCount: number;
}
export declare const TranscriptSchema: import("mongoose").Schema<Transcript, import("mongoose").Model<Transcript, any, any, any, Document<unknown, any, Transcript, any, {}> & Transcript & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transcript, Document<unknown, {}, import("mongoose").FlatRecord<Transcript>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Transcript> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
