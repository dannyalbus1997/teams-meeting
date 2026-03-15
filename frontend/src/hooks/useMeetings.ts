'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  getMeetings,
  getMeeting,
  getMeetingTranscript,
  getMeetingSummary,
  processMeeting,
  toggleActionItem,
} from '@/lib/api';
import {
  Meeting,
  Transcript,
  Summary,
  PaginatedResponse,
  GetMeetingsParams,
} from '@/types';

const meetingsKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingsKeys.all, 'list'] as const,
  list: (params?: GetMeetingsParams) =>
    [...meetingsKeys.lists(), params] as const,
  details: () => [...meetingsKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingsKeys.details(), id] as const,
  transcripts: () => [...meetingsKeys.all, 'transcript'] as const,
  transcript: (meetingId: string) =>
    [...meetingsKeys.transcripts(), meetingId] as const,
  summaries: () => [...meetingsKeys.all, 'summary'] as const,
  summary: (meetingId: string) =>
    [...meetingsKeys.summaries(), meetingId] as const,
};

export const useMeetings = (
  params?: GetMeetingsParams
): UseQueryResult<PaginatedResponse<Meeting>> => {
  return useQuery({
    queryKey: meetingsKeys.list(params),
    queryFn: () => getMeetings(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useMeeting = (
  id?: string,
): UseQueryResult<Meeting> => {
  return useQuery({
    queryKey: meetingsKeys.detail(id || ''),
    queryFn: () => getMeeting(id!),
    enabled: !!id && id !== 'undefined',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useMeetingTranscript = (
  meetingId?: string,
): UseQueryResult<Transcript> => {
  return useQuery({
    queryKey: meetingsKeys.transcript(meetingId || ''),
    queryFn: () => getMeetingTranscript(meetingId!),
    enabled: !!meetingId && meetingId !== 'undefined',
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

export const useMeetingSummary = (
  meetingId?: string,
): UseQueryResult<Summary> => {
  return useQuery({
    queryKey: meetingsKeys.summary(meetingId || ''),
    queryFn: () => getMeetingSummary(meetingId!),
    enabled: !!meetingId && meetingId !== 'undefined',
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

export const useProcessMeeting = (): UseMutationResult<Meeting, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => processMeeting(meetingId),
    onSuccess: (data) => {
      const id = data._id || data.id;
      queryClient.invalidateQueries({ queryKey: meetingsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.transcript(id) });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.summary(id) });
    },
  });
};

export const useToggleActionItem = (): UseMutationResult<
  Summary,
  Error,
  { summaryId: string; actionItemIndex: number; completed: boolean }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, actionItemIndex, completed }) =>
      toggleActionItem(summaryId, actionItemIndex, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsKeys.summaries() });
    },
  });
};
