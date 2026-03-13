'use client';

import { useState } from 'react';
import {
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  Button,
  Alert,
  Skeleton,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { MeetingStatusChip } from '@/components/meetings/MeetingStatusChip';
import { TranscriptViewer } from '@/components/transcripts/TranscriptViewer';
import { KeyPointsList } from '@/components/summaries/KeyPointsList';
import { ActionItemList } from '@/components/summaries/ActionItemList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import {
  useMeeting,
  useMeetingTranscript,
  useMeetingSummary,
  useProcessMeeting,
} from '@/hooks/useMeetings';
import { MeetingStatus } from '@/types';

interface MeetingDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Meeting detail page with tabs for overview, transcript, and summary
 */
export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  const { data: meeting, isLoading: meetingLoading, error: meetingError } =
    useMeeting(id);

  const {
    data: transcript,
    isLoading: transcriptLoading,
    error: transcriptError,
  } = useMeetingTranscript(id, meeting?.status === MeetingStatus.COMPLETED);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useMeetingSummary(id, meeting?.status === MeetingStatus.COMPLETED);

  const {
    mutate: processMeeting,
    isPending: isProcessing,
    error: processError,
  } = useProcessMeeting();

  if (meetingLoading) {
    return <LoadingSpinner message="Loading meeting details..." />;
  }

  if (meetingError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert
          message="Failed to load meeting"
          error={meetingError}
          onRetry={() => router.refresh()}
        />
      </Container>
    );
  }

  if (!meeting) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert message="Meeting not found" />
      </Container>
    );
  }

  const isCompleted = meeting.status === MeetingStatus.COMPLETED;
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);

  return (
    <>
      <Header title={meeting.subject} onRefresh={() => router.refresh()} />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Stack spacing={3}>
          {/* Back button */}
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/meetings"
            variant="text"
            sx={{ width: 'fit-content' }}
          >
            Back to Meetings
          </Button>

          {/* Meeting header */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <div>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {meeting.subject}
                    </Typography>
                    <MeetingStatusChip status={meeting.status} />
                  </div>

                  {!isCompleted && (
                    <Button
                      variant="contained"
                      onClick={() => processMeeting(id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process Meeting'}
                    </Button>
                  )}
                </Box>

                {processError && (
                  <ErrorAlert
                    message="Failed to process meeting"
                    error={processError}
                  />
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Organizer
                      </Typography>
                      <Typography variant="body2">
                        {meeting.organizer}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Start Time
                      </Typography>
                      <Typography variant="body2">
                        {format(startTime, 'PPP p')}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2">
                        {Math.floor(meeting.duration / 3600)}h{' '}
                        {Math.floor((meeting.duration % 3600) / 60)}m
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Participants ({meeting.participants.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {meeting.participants.map((participant) => (
                          <Chip
                            key={participant}
                            label={participant}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Stack>
                  </Grid>

                  {meeting.joinUrl && (
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Join URL
                        </Typography>
                        <Button
                          href={meeting.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                          sx={{ width: 'fit-content' }}
                        >
                          Open Meeting
                        </Button>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          {isCompleted && (
            <Card>
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label="Overview" />
                  <Tab label="Transcript" />
                  <Tab label="Summary" />
                </Tabs>
              </Box>

              <CardContent>
                {/* Overview Tab */}
                {tabValue === 0 && (
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Meeting Summary
                    </Typography>
                    {summaryLoading ? (
                      <Skeleton height={100} />
                    ) : summary ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {summary.summary}
                      </Typography>
                    ) : (
                      <Alert severity="info">
                        Summary not yet available
                      </Alert>
                    )}
                  </Stack>
                )}

                {/* Transcript Tab */}
                {tabValue === 1 && (
                  <>
                    {transcriptError && (
                      <ErrorAlert
                        message="Failed to load transcript"
                        error={transcriptError}
                      />
                    )}
                    {transcriptLoading ? (
                      <Stack spacing={1}>
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                      </Stack>
                    ) : transcript ? (
                      <TranscriptViewer transcript={transcript} />
                    ) : (
                      <Alert severity="info">
                        Transcript not yet available
                      </Alert>
                    )}
                  </>
                )}

                {/* Summary Tab */}
                {tabValue === 2 && (
                  <>
                    {summaryError && (
                      <ErrorAlert
                        message="Failed to load summary"
                        error={summaryError}
                      />
                    )}
                    {summaryLoading ? (
                      <Stack spacing={1}>
                        <Skeleton height={100} />
                        <Skeleton height={100} />
                      </Stack>
                    ) : summary ? (
                      <Stack spacing={3}>
                        {/* Key Points */}
                        <div>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            Key Points
                          </Typography>
                          <KeyPointsList items={summary.keyPoints} />
                        </div>

                        {/* Decisions */}
                        {summary.decisions.length > 0 && (
                          <div>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Decisions
                            </Typography>
                            <KeyPointsList items={summary.decisions} />
                          </div>
                        )}

                        {/* Action Items */}
                        {summary.actionItems.length > 0 && (
                          <div>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Action Items
                            </Typography>
                            <ActionItemList
                              items={summary.actionItems}
                              summaryId={summary.id}
                            />
                          </div>
                        )}

                        {/* Topics */}
                        {summary.topics.length > 0 && (
                          <div>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Topics Discussed
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {summary.topics.map((topic) => (
                                <Chip key={topic} label={topic} />
                              ))}
                            </Box>
                          </div>
                        )}

                        {/* Metadata */}
                        <Box
                          sx={{
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                          >
                            <span>
                              AI Provider: {summary.aiProvider}
                            </span>
                            <span>
                              Model: {summary.modelUsed}
                            </span>
                            <span>
                              Processing Time: {summary.processingTimeMs}ms
                            </span>
                            <span>
                              Sentiment: {summary.sentiment}
                            </span>
                          </Stack>
                        </Box>
                      </Stack>
                    ) : (
                      <Alert severity="info">
                        Summary not yet available
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!isCompleted && (
            <Alert severity="info">
              This meeting is currently being processed. Come back later to view
              the transcript and summary.
            </Alert>
          )}
        </Stack>
      </Container>
    </>
  );
}
