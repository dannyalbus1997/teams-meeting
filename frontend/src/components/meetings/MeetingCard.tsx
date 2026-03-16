'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  CardActionArea,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Meeting, MeetingStatus } from '@/types';
import { MeetingStatusChip } from './MeetingStatusChip';
import { processMeeting } from '@/lib/api';

interface MeetingCardProps {
  meeting: Meeting;
  onProcessed?: () => void;
}

/**
 * Card component displaying summary information about a meeting
 */
export function MeetingCard({ meeting, onProcessed }: MeetingCardProps) {
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const startTime = new Date(meeting.startTime);
  const durationHours = Math.floor(meeting.duration / 3600);
  const durationMinutes = Math.floor((meeting.duration % 3600) / 60);
  const meetingId = meeting._id || meeting.id;

  const canProcess = [
    MeetingStatus.DETECTED,
    MeetingStatus.LIVE,
    MeetingStatus.RECORDING_AVAILABLE,
    MeetingStatus.TRANSCRIBED,
    MeetingStatus.FAILED,
  ].includes(meeting.status);

  const handleProcess = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProcessing(true);
    try {
      await processMeeting(meetingId);
      setSnackbar({ open: true, message: 'Meeting processed successfully!', severity: 'success' });
      onProcessed?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Processing failed';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea component={Link} href={`/meetings/${meetingId}`} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
              {meeting.subject}
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {format(startTime, 'MMM d, yyyy')} at {format(startTime, 'h:mm a')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {durationHours > 0 && `${durationHours}h `}{durationMinutes}m
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {meeting.participants.length} participants
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <MeetingStatusChip status={meeting.status} />
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(startTime, { addSuffix: true })}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>

        {canProcess && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleProcess}
              disabled={processing}
              sx={{ textTransform: 'none' }}
            >
              {processing ? 'Processing...' : 'Fetch Recording & Transcribe'}
            </Button>
          </Box>
        )}
      </Card>

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
