'use client';

import { Box, CircularProgress, Typography, Stack } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

/**
 * Simple centered loading spinner component
 */
export function LoadingSpinner({
  message = 'Loading...',
  fullHeight = true,
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(fullHeight && { height: '100vh' }),
        ...(!fullHeight && { minHeight: 300 }),
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography color="text.secondary">{message}</Typography>
      </Stack>
    </Box>
  );
}
