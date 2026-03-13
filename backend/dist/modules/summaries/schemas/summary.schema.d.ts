import { Document, Types } from 'mongoose';
export type SummaryDocument = Summary & Document;
export declare class ActionItem {
    assignee: string;
    task: string;
    deadline: string;
    priority: string;
    completed: boolean;
}
export declare const ActionItemSchema: import("mongoose").Schema<ActionItem, import("mongoose").Model<ActionItem, any, any, any, Document<unknown, any, ActionItem, any, {}> & ActionItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ActionItem, Document<unknown, {}, import("mongoose").FlatRecord<ActionItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ActionItem> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Summary {
    meetingId: Types.ObjectId;
    transcriptId: Types.ObjectId;
    summary: string;
    keyPoints: string[];
    actionItems: ActionItem[];
    decisions: string[];
    topics: string[];
    sentiment: string;
    aiProvider: string;
    modelUsed: string;
    processingTimeMs: number;
}
export declare const SummarySchema: import("mongoose").Schema<Summary, import("mongoose").Model<Summary, any, any, any, Document<unknown, any, Summary, any, {}> & Summary & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Summary, Document<unknown, {}, import("mongoose").FlatRecord<Summary>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Summary> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
