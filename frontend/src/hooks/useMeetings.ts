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

/**
 * Query keys for React Query cache management
 */
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

/**
 * Hook to fetch paginated meetings list
 */
export const useMeetings = (
  params?: GetMeetingsParams
): UseQueryResult<PaginatedResponse<Meeting>> => {
  return useQuery({
    queryKey: meetingsKeys.list(params),
    queryFn: () => getMeetings(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to fetch a single meeting
 */
export const useMeeting = (
  id: string,
  enabled = true
): UseQueryResult<Meeting> => {
  return useQuery({
    queryKey: meetingsKeys.detail(id),
    queryFn: () => getMeeting(id),
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to fetch meeting transcript
 */
export const useMeetingTranscript = (
  meetingId: string,
  enabled = true
): UseQueryResult<Transcript> => {
  return useQuery({
    queryKey: meetingsKeys.transcript(meetingId),
    queryFn: () => getMeetingTranscript(meetingId),
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

/**
 * Hook to fetch meeting summary
 */
export const useMeetingSummary = (
  meetingId: string,
  enabled = true
): UseQueryResult<Summary> => {
  return useQuery({
    queryKey: meetingsKeys.summary(meetingId),
    queryFn: () => getMeetingSummary(meetingId),
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
};

/**
 * Mutation hook to trigger meeting processing
 */
export const useProcessMeeting = (): UseMutationResult<Meeting, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => processMeeting(meetingId),
    onSuccess: (data) => {
      // Invalidate and refetch affected queries
      queryClient.invalidateQueries({
        queryKey: meetingsKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: meetingsKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: meetingsKeys.transcript(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: meetingsKeys.summary(data.id),
      });
    },
  });
};

/**
 * Mutation hook to toggle action item completion status
 */
export const useToggleActionItem = (): UseMutationResult<
  Summary,
  Error,
  { summaryId: string; actionItemIndex: number; completed: boolean }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, actionItemIndex, completed }) =>
      toggleActionItem(summaryId, actionItemIndex, completed),
    onSuccess: (data) => {
      // Invalidate and refetch affected queries
      queryClient.invalidateQueries({
        queryKey: meetingsKeys.summaries(),
      });
    },
  });
};
