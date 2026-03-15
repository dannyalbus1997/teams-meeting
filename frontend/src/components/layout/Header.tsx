'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { syncMeetings } from '@/lib/api';

interface HeaderProps {
  title?: string;
  onRefresh?: () => void;
}

/**
 * App header component with title, sync button, refresh button, and user avatar
 */
export function Header({ title = 'Teams Meeting Summarizer', onRefresh }: HeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncMeetings();
      setSnackbar({
        open: true,
        message: result.message || `Synced ${result.synced} meeting(s) from Teams`,
        severity: result.synced > 0 ? 'success' : 'info',
      });
      // Auto-refresh the list after sync
      if (onRefresh) {
        setTimeout(() => onRefresh(), 500);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Sync failed';
      setSnackbar({
        open: true,
        message: msg.includes('Not authenticated')
          ? 'Not authenticated. Please login first at /api/auth/login'
          : `Sync failed: ${msg}`,
        severity: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: '#FFFFFF',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.125rem',
              flex: 1,
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Sync meetings from Teams">
              <span>
                <IconButton
                  color="secondary"
                  onClick={handleSync}
                  disabled={syncing}
                  size="small"
                >
                  {syncing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SyncIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  color="primary"
                  onClick={onRefresh}
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="User profile">
              <Avatar
                sx={{
                  backgroundColor: 'primary.main',
                  width: 40,
                  height: 40,
                  cursor: 'pointer',
                }}
              >
                <PersonIcon />
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
