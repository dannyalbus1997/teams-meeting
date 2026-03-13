import axios, { AxiosInstance } from 'axios';
import {
  Meeting,
  Transcript,
  Summary,
  PaginatedResponse,
  GetMeetingsParams,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Create and configure axios client
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Add interceptors for global error handling if needed
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Fetch paginated list of meetings
 */
export const getMeetings = async (
  params?: GetMeetingsParams
): Promise<PaginatedResponse<Meeting>> => {
  const response = await apiClient.get<PaginatedResponse<Meeting>>(
    '/meetings',
    { params }
  );
  return response.data;
};

/**
 * Fetch a single meeting by ID
 */
export const getMeeting = async (id: string): Promise<Meeting> => {
  const response = await apiClient.get<Meeting>(`/meetings/${id}`);
  return response.data;
};

/**
 * Fetch transcript for a meeting
 */
export const getMeetingTranscript = async (
  meetingId: string
): Promise<Transcript> => {
  const response = await apiClient.get<Transcript>(
    `/meetings/${meetingId}/transcript`
  );
  return response.data;
};

/**
 * Fetch summary for a meeting
 */
export const getMeetingSummary = async (
  meetingId: string
): Promise<Summary> => {
  const response = await apiClient.get<Summary>(
    `/meetings/${meetingId}/summary`
  );
  return response.data;
};

/**
 * Trigger processing for a meeting
 */
export const processMeeting = async (id: string): Promise<Meeting> => {
  const response = await apiClient.post<Meeting>(
    `/meetings/${id}/process`
  );
  return response.data;
};

/**
 * Toggle completion status of an action item
 */
export const toggleActionItem = async (
  summaryId: string,
  actionItemIndex: number,
  completed: boolean
): Promise<Summary> => {
  const response = await apiClient.patch<Summary>(
    `/summaries/${summaryId}/action-items/${actionItemIndex}`,
    { completed }
  );
  return response.data;
};

/**
 * Create a new meeting
 */
export const createMeeting = async (
  data: Partial<Meeting>
): Promise<Meeting> => {
  const response = await apiClient.post<Meeting>('/meetings', data);
  return response.data;
};

export default apiClient;
