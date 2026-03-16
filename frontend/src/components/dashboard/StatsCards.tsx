'use client';

import { Grid, Card, CardContent, Typography, Box, Stack } from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

interface StatsCardsProps {
  total: number;
  synced: number;
  transcriptFetched: number;
  summarized: number;
  failed: number;
}

export function StatsCards({ total, synced, transcriptFetched, summarized, failed }: StatsCardsProps) {
  const stats = [
    { label: 'Total Meetings', value: total, icon: <VideoCallIcon />, color: '#4F46E5', bgColor: '#F0F1FF' },
    { label: 'Synced', value: synced, icon: <SyncIcon />, color: '#6B7280', bgColor: '#F3F4F6' },
    { label: 'Transcript Ready', value: transcriptFetched, icon: <DescriptionIcon />, color: '#0EA5E9', bgColor: '#F0F9FF' },
    { label: 'Summarized', value: summarized, icon: <CheckCircleIcon />, color: '#10B981', bgColor: '#F0FDF4' },
    { label: 'Failed', value: failed, icon: <ErrorIcon />, color: '#EF4444', bgColor: '#FEF2F2' },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={4} md={2.4} key={index}>
          <Card
            sx={{
              height: '100%',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
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
                  <Typography color="text.secondary" variant="caption">
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>
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
