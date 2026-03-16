/**
 * Meeting status — matches backend MeetingStatus enum
 */
export enum MeetingStatus {
  SYNCED = 'synced',
  TRANSCRIPT_FETCHED = 'transcript_fetched',
  SUMMARIZED = 'summarized',
  FAILED = 'failed',
}

/**
 * Represents a Teams meeting
 */
export interface Meeting {
  id: string;
  _id: string;
  subject: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  organizerEmail: string;
  attendees: string[];
  joinUrl: string;
  onlineMeetingId?: string;
  calendarEventId?: string;
  status: MeetingStatus;
  transcriptId?: string;
  summaryId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Meeting with transcript and summary populated (from GET /meetings/:id)
 */
export interface MeetingWithDetails extends Meeting {
  transcript?: Transcript | null;
  summary?: Summary | null;
}

/**
 * Transcript segment
 */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence: number;
}

/**
 * Full transcript
 */
export interface Transcript {
  id: string;
  _id: string;
  meetingId: string;
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
  source: string;
  wordCount: number;
  createdAt: string;
}

/**
 * Action item from AI summary
 */
export interface ActionItem {
  assignee: string;
  task: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

/**
 * AI-generated summary
 */
export interface Summary {
  id: string;
  _id: string;
  meetingId: string;
  transcriptId: string;
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  topics: string[];
  sentiment: string;
  aiProvider: string;
  modelUsed: string;
  processingTimeMs: number;
  createdAt: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Query params for meetings list
 */
export interface GetMeetingsParams {
  status?: MeetingStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Sync response
 */
export interface SyncResponse {
  synced: number;
  total: number;
}
