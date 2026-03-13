export declare class ActionItemDto {
    assignee: string;
    task: string;
    deadline?: string;
    priority?: 'high' | 'medium' | 'low';
}
export declare class CreateSummaryDto {
    meetingId: string;
    transcriptId: string;
    summary: string;
    keyPoints?: string[];
    actionItems?: ActionItemDto[];
    decisions?: string[];
    topics?: string[];
    sentiment?: string;
    aiProvider?: string;
    modelUsed?: string;
    processingTimeMs?: number;
}
