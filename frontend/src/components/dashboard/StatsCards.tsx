'use client';

import { Grid, Card, CardContent, Typography, Box, Stack } from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatsCardsProps {
  totalMeetings: number;
  completedMeetings: number;
  pendingMeetings: number;
  failedMeetings: number;
}

/**
 * Dashboard stat cards component showing meeting statistics
 */
export function StatsCards({
  totalMeetings,
  completedMeetings,
  pendingMeetings,
  failedMeetings,
}: StatsCardsProps) {
  const stats: StatItem[] = [
    {
      label: 'Total Meetings',
      value: totalMeetings,
      icon: <VideoCallIcon />,
      color: '#4F46E5',
      bgColor: '#F0F1FF',
    },
    {
      label: 'Completed',
      value: completedMeetings,
      icon: <CheckCircleIcon />,
      color: '#10B981',
      bgColor: '#F0FDF4',
    },
    {
      label: 'Pending',
      value: pendingMeetings,
      icon: <ScheduleIcon />,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      label: 'Failed',
      value: failedMeetings,
      icon: <ErrorIcon />,
      color: '#EF4444',
      bgColor: '#FEF2F2',
    },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              height: '100%',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              },
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>

                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: stat.color }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
