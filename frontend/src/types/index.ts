/**
 * Enum for meeting processing status
 */
export enum MeetingStatus {
  DETECTED = 'detected',
  LIVE = 'live',
  RECORDING_AVAILABLE = 'recording_available',
  TRANSCRIBING = 'transcribing',
  TRANSCRIBED = 'transcribed',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Represents a Teams meeting
 */
export interface Meeting {
  id: string;
  _id: string;
  teamsEventId: string;
  subject: string;
  organizer: string;
  participants: string[];
  startTime: string;
  endTime: string;
  duration: number;
  joinUrl: string;
  status: MeetingStatus;
  transcriptId?: string;
  summaryId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a segment of transcript with speaker info
 */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence: number;
}

/**
 * Represents the full transcript of a meeting
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
 * Represents an action item from the summary
 */
export interface ActionItem {
  assignee: string;
  task: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

/**
 * Represents the AI-generated summary of a meeting
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
 * Generic paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Meeting with optional transcript and summary
 */
export interface MeetingWithDetails extends Meeting {
  transcript?: Transcript;
  summary?: Summary;
}

/**
 * Query parameters for fetching meetings
 */
export interface GetMeetingsParams {
  status?: MeetingStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
