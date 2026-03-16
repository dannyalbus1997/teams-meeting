'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  CardActionArea,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Meeting } from '@/types';
import { MeetingStatusChip } from './MeetingStatusChip';

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea component={Link} href={`/meetings/${meeting._id || meeting.id}`}>
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
              <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {meeting.organizerName || meeting.organizerEmail || 'Unknown'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {meeting.attendees?.length || 0} attendees &middot; {durationMinutes}min
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
    </Card>
  );
}
