'use client';

import {
  Alert,
  AlertProps,
  Box,
  Button,
  Stack,
} from '@mui/material';

interface ErrorAlertProps extends Omit<AlertProps, 'children'> {
  message: string;
  error?: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

/**
 * Error display component with optional retry button
 */
export function ErrorAlert({
  message,
  error,
  onRetry,
  showDetails = false,
  severity = 'error',
  ...props
}: ErrorAlertProps) {
  const errorMessage =
    typeof error === 'string' ? error : error?.message || '';

  return (
    <Alert severity={severity} {...props}>
      <Stack spacing={1}>
        <Box>{message}</Box>
        {showDetails && errorMessage && (
          <Box
            sx={{
              fontSize: '0.875rem',
              color: 'inherit',
              opacity: 0.8,
            }}
          >
            {errorMessage}
          </Box>
        )}
        {onRetry && (
          <Box>
            <Button
              size="small"
              onClick={onRetry}
              sx={{
                color: severity === 'error' ? 'error.main' : 'inherit',
                textTransform: 'none',
                fontWeight: 500,
                p: 0,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Retry
            </Button>
          </Box>
        )}
      </Stack>
    </Alert>
  );
}
