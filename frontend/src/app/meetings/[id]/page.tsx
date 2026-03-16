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
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  BugReport as BugReportIcon,
  SmartToy as BotIcon,
  CallEnd as CallEndIcon,
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
} from '@/hooks/useMeetings';
import { MeetingStatus } from '@/types';
import { processMeeting, diagnoseMeeting, botJoinMeeting, botLeaveMeeting, getBotStatus } from '@/lib/api';

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
  const [processing, setProcessing] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [botJoining, setBotJoining] = useState(false);
  const [botCallId, setBotCallId] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [botLeaving, setBotLeaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  });

  const { data: meeting, isLoading: meetingLoading, error: meetingError, refetch: refetchMeeting } =
    useMeeting(id);

  const {
    data: transcript,
    isLoading: transcriptLoading,
    error: transcriptError,
    refetch: refetchTranscript,
  } = useMeetingTranscript(id);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useMeetingSummary(id);

  const handleProcess = async () => {
    setProcessing(true);
    setDiagResult(null);
    try {
      await processMeeting(id);
      setSnackbar({ open: true, message: 'Meeting processed successfully! Transcript and summary generated.', severity: 'success' });
      refetchMeeting();
      refetchTranscript();
      refetchSummary();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Processing failed';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const result = await diagnoseMeeting(id);
      setDiagResult(result);
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Diagnosis failed: ' + (error.message || 'Unknown error'), severity: 'error' });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleBotJoin = async () => {
    setBotJoining(true);
    try {
      const result = await botJoinMeeting(id);
      setBotCallId(result.callId);
      setBotStatus(result.status);
      setSnackbar({
        open: true,
        message: 'Bot is joining the meeting and will start recording automatically!',
        severity: 'success',
      });
      refetchMeeting();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Bot join failed';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setBotJoining(false);
    }
  };

  const handleBotLeave = async () => {
    if (!botCallId) return;
    setBotLeaving(true);
    try {
      await botLeaveMeeting(botCallId);
      setSnackbar({
        open: true,
        message: 'Bot is leaving. Recording will be processed and transcribed shortly.',
        severity: 'success',
      });
      setBotCallId(null);
      setBotStatus(null);
      // Refresh after a delay to pick up the processed results
      setTimeout(() => {
        refetchMeeting();
        refetchTranscript();
        refetchSummary();
      }, 5000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message;
      setSnackbar({ open: true, message: `Leave failed: ${msg}`, severity: 'error' });
    } finally {
      setBotLeaving(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      const status = await getBotStatus(id);
      if (status.active) {
        setBotCallId(status.callId || null);
        setBotStatus(status.status || null);
      }
    } catch {
      // Bot not active
    }
  };

  const handleRefresh = () => {
    refetchMeeting();
    refetchTranscript();
    refetchSummary();
  };

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
  const isProcessing = [MeetingStatus.TRANSCRIBING, MeetingStatus.ANALYZING].includes(meeting.status);
  const canProcess = [
    MeetingStatus.DETECTED,
    MeetingStatus.LIVE,
    MeetingStatus.RECORDING_AVAILABLE,
    MeetingStatus.TRANSCRIBED,
    MeetingStatus.FAILED,
  ].includes(meeting.status);

  const hasTranscript = !!transcript && !!transcript.fullText;
  const hasSummary = !!summary && !!summary.summary;
  const showTabs = isCompleted || hasTranscript || hasSummary;

  const startTime = new Date(meeting.startTime);

  return (
    <>
      <Header title={meeting.subject} onRefresh={handleRefresh} />

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

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {/* Bot Join / Leave */}
                    {!botCallId && !isCompleted && (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={botJoining ? <CircularProgress size={18} color="inherit" /> : <BotIcon />}
                        onClick={handleBotJoin}
                        disabled={botJoining}
                      >
                        {botJoining ? 'Bot Joining...' : 'Bot Join & Record'}
                      </Button>
                    )}
                    {botCallId && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={botLeaving ? <CircularProgress size={18} color="inherit" /> : <CallEndIcon />}
                        onClick={handleBotLeave}
                        disabled={botLeaving}
                      >
                        {botLeaving ? 'Leaving...' : `Bot Leave & Process`}
                      </Button>
                    )}

                    {/* Manual Process */}
                    {canProcess && (
                      <Button
                        variant="contained"
                        startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                        onClick={handleProcess}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Fetch Recording & Transcribe'}
                      </Button>
                    )}
                    {isProcessing && (
                      <Button variant="outlined" disabled>
                        <CircularProgress size={18} sx={{ mr: 1 }} /> Processing...
                      </Button>
                    )}
                    {canProcess && (
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={diagnosing ? <CircularProgress size={18} /> : <BugReportIcon />}
                        onClick={handleDiagnose}
                        disabled={diagnosing}
                        size="small"
                      >
                        Diagnose
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Bot status banner */}
                {botCallId && (
                  <Alert severity="success" icon={<BotIcon />}>
                    <Typography variant="body2">
                      <strong>Bot is active in this meeting</strong> (Call ID: {botCallId.substring(0, 12)}..., Status: {botStatus})
                      {' — '}Click "Bot Leave & Process" when the meeting is done to generate transcript and summary.
                    </Typography>
                  </Alert>
                )}

                {/* Diagnosis results */}
                {diagResult && (
                  <Alert
                    severity={diagResult.steps?.some((s: any) => s.result.startsWith('FAIL')) ? 'warning' : 'success'}
                    onClose={() => setDiagResult(null)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Diagnosis Results
                    </Typography>
                    {diagResult.steps?.map((step: any, i: number) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {step.result.startsWith('FAIL') ? '\u274c' : step.result.startsWith('OK') ? '\u2705' : '\u2139\ufe0f'} <strong>{step.step}:</strong> {step.result}
                      </Typography>
                    ))}
                    {diagResult.transcriptPreview && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                        Preview: {diagResult.transcriptPreview.substring(0, 200)}...
                      </Typography>
                    )}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">Organizer</Typography>
                      <Typography variant="body2">{meeting.organizer}</Typography>
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
                      <Typography variant="body2">
                        {Math.floor(meeting.duration / 3600)}h {Math.floor((meeting.duration % 3600) / 60)}m
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
                          <Chip key={participant} label={participant} size="small" />
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

          {/* Tabs for transcript / summary */}
          {showTabs && (
            <Card>
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
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
                    ) : hasSummary ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {summary!.summary}
                      </Typography>
                    ) : (
                      <Alert severity="info">
                        Summary not yet available. Click "Fetch Recording & Transcribe" to generate one.
                      </Alert>
                    )}
                  </Stack>
                )}

                {/* Transcript Tab */}
                {tabValue === 1 && (
                  <>
                    {transcriptLoading ? (
                      <Stack spacing={1}>
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                        <Skeleton height={80} />
                      </Stack>
                    ) : hasTranscript ? (
                      <TranscriptViewer transcript={transcript!} />
                    ) : (
                      <Alert severity="info">
                        Transcript not yet available. Click "Fetch Recording & Transcribe" to generate one.
                      </Alert>
                    )}
                  </>
                )}

                {/* Summary Tab */}
                {tabValue === 2 && (
                  <>
                    {summaryLoading ? (
                      <Stack spacing={1}>
                        <Skeleton height={100} />
                        <Skeleton height={100} />
                      </Stack>
                    ) : hasSummary ? (
                      <Stack spacing={3}>
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
                            <ActionItemList
                              items={summary!.actionItems}
                              summaryId={summary!._id || summary!.id}
                            />
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
                            {summary!.aiProvider && <span>AI Provider: {summary!.aiProvider}</span>}
                            {summary!.modelUsed && <span>Model: {summary!.modelUsed}</span>}
                            <span>Processing Time: {summary!.processingTimeMs}ms</span>
                            {summary!.sentiment && <span>Sentiment: {summary!.sentiment}</span>}
                          </Stack>
                        </Box>
                      </Stack>
                    ) : (
                      <Alert severity="info">
                        Summary not yet available. Click "Fetch Recording & Transcribe" to generate one.
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!showTabs && !isProcessing && (
            <Alert severity="info">
              No transcript or summary available yet. Click "Fetch Recording & Transcribe" to pull the recording from Teams and generate an AI summary.
              If it fails, click "Diagnose" to see exactly where the issue is.
            </Alert>
          )}

          {isProcessing && (
            <Alert severity="info" icon={<CircularProgress size={20} />}>
              This meeting is currently being processed. Refresh in a moment to see results.
            </Alert>
          )}
        </Stack>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
