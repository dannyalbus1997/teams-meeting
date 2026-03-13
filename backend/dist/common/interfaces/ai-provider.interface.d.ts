export interface MeetingAnalysis {
    summary: string;
    keyPoints: string[];
    actionItems: ActionItem[];
    decisions: string[];
    sentiment?: string;
    topics?: string[];
}
export interface ActionItem {
    assignee: string;
    task: string;
    deadline?: string;
    priority?: 'high' | 'medium' | 'low';
}
export interface AiProvider {
    analyzeTranscript(transcript: string, meetingTopic?: string): Promise<MeetingAnalysis>;
    summarize(text: string): Promise<string>;
}
export declare const AI_PROVIDER = "AI_PROVIDER";
