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
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  AutoAwesome as AutoAwesomeIcon,
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
import { useMeeting, useFetchTranscript, useSummarizeMeeting } from '@/hooks/useMeetings';
import { MeetingStatus } from '@/types';

interface MeetingDetailPageProps {
  params: { id: string };
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  const { data: meeting, isLoading: meetingLoading, error: meetingError, refetch } = useMeeting(id);

  const {
    mutate: doFetchTranscript,
    isPending: isFetchingTranscript,
    error: fetchTranscriptError,
  } = useFetchTranscript();

  const {
    mutate: doSummarize,
    isPending: isSummarizing,
    error: summarizeError,
  } = useSummarizeMeeting();

  if (meetingLoading) return <LoadingSpinner message="Loading meeting details..." />;

  if (meetingError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert message="Failed to load meeting" error={meetingError} onRetry={() => router.refresh()} />
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

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const transcript = meeting.transcript;
  const summary = meeting.summary;
  const hasTranscript = !!transcript;
  const hasSummary = !!summary;

  // Determine which action buttons to show
  const canFetchTranscript = meeting.status === MeetingStatus.SYNCED;
  const canSummarize = meeting.status === MeetingStatus.TRANSCRIPT_FETCHED;
  return (
    <>
      <Header title={meeting.subject} onRefresh={() => refetch()} />

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

          {/* Meeting header card */}
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

                  <Stack direction="row" spacing={1}>
                    {/* Step 2 button: Fetch Transcript */}
                    {canFetchTranscript && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={() => doFetchTranscript(id)}
                        disabled={isFetchingTranscript}
                      >
                        {isFetchingTranscript ? 'Fetching Transcript...' : 'Fetch Transcript'}
                      </Button>
                    )}

                    {/* Step 3 button: Summarize */}
                    {canSummarize && (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => doSummarize(id)}
                        disabled={isSummarizing}
                      >
                        {isSummarizing ? 'Summarizing with GPT-4o...' : 'Summarize with AI'}
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Error alerts */}
                {fetchTranscriptError && (
                  <ErrorAlert message="Failed to fetch transcript" error={fetchTranscriptError} />
                )}
                {summarizeError && (
                  <ErrorAlert message="Failed to summarize" error={summarizeError} />
                )}
                {meeting.errorMessage && (
                  <Alert severity="warning">{meeting.errorMessage}</Alert>
                )}

                {/* Meeting info grid */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">Organizer</Typography>
                      <Typography variant="body2">
                        {meeting.organizerName || meeting.organizerEmail || 'Unknown'}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">Start Time</Typography>
                      <Typography variant="body2">{format(startTime, 'PPP p')}</Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                      <Typography variant="body2">{durationMinutes} minutes</Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Attendees ({meeting.attendees?.length || 0})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(meeting.attendees || []).map((att) => (
                          <Chip key={att} label={att} size="small" />
                        ))}
                      </Box>
                    </Stack>
                  </Grid>

                  {meeting.joinUrl && (
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">Join URL</Typography>
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

          {/* Tabs: only show when we have transcript or summary */}
          {(hasTranscript || hasSummary) && (
            <Card>
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  {hasSummary && <Tab label="Overview" />}
                  {hasTranscript && <Tab label="Transcript" />}
                  {hasSummary && <Tab label="Details" />}
                </Tabs>
              </Box>

              <CardContent>
                {/* Build tab content dynamically based on what's available */}
                {(() => {
                  const tabs: React.ReactNode[] = [];

                  // Overview tab (summary text)
                  if (hasSummary) {
                    tabs.push(
                      <Stack spacing={2} key="overview">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Meeting Summary
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {summary!.summary}
                        </Typography>
                      </Stack>,
                    );
                  }

                  // Transcript tab
                  if (hasTranscript) {
                    tabs.push(
                      <TranscriptViewer key="transcript" transcript={transcript!} />,
                    );
                  }

                  // Details tab (key points, decisions, actions, topics)
                  if (hasSummary) {
                    tabs.push(
                      <Stack spacing={3} key="details">
                        {summary!.keyPoints.length > 0 && (
                          <div>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                              Key Points
                            </Typography>
                            <KeyPointsList items={summary!.keyPoints} />
                          </div>
                        )}
                        {summary!.decisions.length > 0 && (
                          <div>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                              Decisions
                            </Typography>
                            <KeyPointsList items={summary!.decisions} />
                          </div>
                        )}
                        {summary!.actionItems.length > 0 && (
                          <div>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                              Action Items
                            </Typography>
                            <ActionItemList items={summary!.actionItems} summaryId={summary!._id || summary!.id} />
                          </div>
                        )}
                        {summary!.topics.length > 0 && (
                          <div>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                              Topics Discussed
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {summary!.topics.map((topic) => (
                                <Chip key={topic} label={topic} />
                              ))}
                            </Box>
                          </div>
                        )}
                        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                          >
                            <span>AI Provider: {summary!.aiProvider}</span>
                            <span>Model: {summary!.modelUsed}</span>
                            <span>Processing: {summary!.processingTimeMs}ms</span>
                            {summary!.sentiment && <span>Sentiment: {summary!.sentiment}</span>}
                          </Stack>
                        </Box>
                      </Stack>,
                    );
                  }

                  return tabs[tabValue] || null;
                })()}
              </CardContent>
            </Card>
          )}

          {/* Info when nothing fetched yet */}
          {!hasTranscript && !hasSummary && meeting.status === MeetingStatus.SYNCED && (
            <Alert severity="info">
              This meeting was synced from Teams. Click &quot;Fetch Transcript&quot; to download
              the transcript, then &quot;Summarize with AI&quot; to generate a summary.
            </Alert>
          )}

          {meeting.status === MeetingStatus.FAILED && (
            <Alert severity="error">
              Processing failed: {meeting.errorMessage || 'Unknown error'}
            </Alert>
          )}
        </Stack>
      </Container>
    </>
  );
}
