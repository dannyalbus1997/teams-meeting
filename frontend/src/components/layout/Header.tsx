'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface HeaderProps {
  title?: string;
  onRefresh?: () => void;
}

/**
 * App header component with title, refresh button, and user avatar
 */
export function Header({ title = 'Teams Meeting Summarizer', onRefresh }: HeaderProps) {
  return (
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
  );
}
