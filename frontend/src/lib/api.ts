import axios, { AxiosInstance } from 'axios';
import {
  Meeting,
  MeetingWithDetails,
  Summary,
  PaginatedResponse,
  GetMeetingsParams,
  SyncResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s — summarization can take a while
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  },
);

// ─── Meetings CRUD ─────────────────────────────

export const getMeetings = async (
  params?: GetMeetingsParams,
): Promise<PaginatedResponse<Meeting>> => {
  const response = await apiClient.get<PaginatedResponse<Meeting>>('/meetings', { params });
  return response.data;
};

export const getMeeting = async (id: string): Promise<MeetingWithDetails> => {
  const response = await apiClient.get<MeetingWithDetails>(`/meetings/${id}`);
  return response.data;
};

export const getMeetingStats = async (): Promise<{
  total: number;
  synced: number;
  transcriptFetched: number;
  summarized: number;
  failed: number;
}> => {
  const response = await apiClient.get('/meetings/stats');
  return response.data;
};

// ─── Step 1: Sync meetings from Teams ──────────

export const syncMeetings = async (daysBack: number = 7): Promise<SyncResponse> => {
  const response = await apiClient.post<SyncResponse>('/meetings/sync', {}, {
    params: { daysBack },
  });
  return response.data;
};

// ─── Step 2: Fetch transcript ──────────────────

export const fetchTranscript = async (meetingId: string): Promise<Meeting> => {
  const response = await apiClient.post<Meeting>(`/meetings/${meetingId}/fetch-transcript`, {});
  return response.data;
};

// ─── Step 3: Summarize ─────────────────────────

export const summarizeMeeting = async (meetingId: string): Promise<Meeting> => {
  const response = await apiClient.post<Meeting>(`/meetings/${meetingId}/summarize`, {});
  return response.data;
};

// ─── Action items ──────────────────────────────

export const toggleActionItem = async (
  summaryId: string,
  actionItemIndex: number,
  completed: boolean,
): Promise<Summary> => {
  const response = await apiClient.patch<Summary>(
    `/summaries/${summaryId}/action-items/${actionItemIndex}`,
    { completed },
  );
  return response.data;
};

export default apiClient;
