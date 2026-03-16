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
  getMeetingStats,
  fetchTranscript,
  summarizeMeeting,
  toggleActionItem,
} from '@/lib/api';
import {
  Meeting,
  MeetingWithDetails,
  PaginatedResponse,
  GetMeetingsParams,
} from '@/types';

const meetingsKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingsKeys.all, 'list'] as const,
  list: (params?: GetMeetingsParams) => [...meetingsKeys.lists(), params] as const,
  details: () => [...meetingsKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingsKeys.details(), id] as const,
  stats: () => [...meetingsKeys.all, 'stats'] as const,
};

export const useMeetings = (
  params?: GetMeetingsParams,
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
): UseQueryResult<MeetingWithDetails> => {
  return useQuery({
    queryKey: meetingsKeys.detail(id || ''),
    queryFn: () => getMeeting(id!),
    enabled: !!id && id !== 'undefined',
    staleTime: 1000 * 60 * 2,
  });
};

export const useMeetingStats = () => {
  return useQuery({
    queryKey: meetingsKeys.stats(),
    queryFn: () => getMeetingStats(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutation: Fetch transcript from Graph API (Step 2)
 */
export const useFetchTranscript = (): UseMutationResult<Meeting, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => fetchTranscript(meetingId),
    onSuccess: (data) => {
      const id = data._id || data.id;
      queryClient.invalidateQueries({ queryKey: meetingsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.stats() });
    },
  });
};

/**
 * Mutation: Summarize with OpenAI GPT-4o (Step 3)
 */
export const useSummarizeMeeting = (): UseMutationResult<Meeting, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => summarizeMeeting(meetingId),
    onSuccess: (data) => {
      const id = data._id || data.id;
      queryClient.invalidateQueries({ queryKey: meetingsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingsKeys.stats() });
    },
  });
};

export const useToggleActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ summaryId, actionItemIndex, completed }: {
      summaryId: string;
      actionItemIndex: number;
      completed: boolean;
    }) => toggleActionItem(summaryId, actionItemIndex, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingsKeys.all });
    },
  });
};
