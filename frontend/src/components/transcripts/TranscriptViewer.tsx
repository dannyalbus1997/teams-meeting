'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Stack,
  Paper,
  Chip,
} from '@mui/material';
import { Transcript, TranscriptSegment } from '@/types';

interface TranscriptViewerProps {
  transcript: Transcript;
}

type ViewMode = 'full' | 'segments';

/**
 * Component for viewing meeting transcripts with multiple view modes
 */
export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('segments');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) {
      return transcript.segments;
    }

    const query = searchQuery.toLowerCase();
    return transcript.segments.filter(
      (segment) =>
        segment.text.toLowerCase().includes(query) ||
        segment.speaker.toLowerCase().includes(query)
    );
  }, [transcript.segments, searchQuery]);

  return (
    <Stack spacing={2}>
      {/* Search and view mode controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          sx={{ flex: 1 }}
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
        >
          <ToggleButton value="segments">Segments</ToggleButton>
          <ToggleButton value="full">Full Text</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Transcript metadata */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip
          label={`Language: ${transcript.language}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${transcript.wordCount} words`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${Math.floor(transcript.duration / 60)} minutes`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {/* Full text view */}
      {viewMode === 'full' && (
        <Paper sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.8,
              color: 'text.primary',
            }}
          >
            {transcript.fullText}
          </Typography>
        </Paper>
      )}

      {/* Segments view */}
      {viewMode === 'segments' && (
        <Stack spacing={2}>
          {filteredSegments.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No segments match your search
            </Typography>
          ) : (
            filteredSegments.map((segment, index) => (
              <SegmentBlock key={index} segment={segment} />
            ))
          )}
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Individual transcript segment component
 */
function SegmentBlock({ segment }: { segment: TranscriptSegment }) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            {segment.speaker}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(segment.start)} - {formatTime(segment.end)}
            </Typography>
            {segment.confidence < 0.9 && (
              <Chip
                label={`${Math.round(segment.confidence * 100)}% confidence`}
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            lineHeight: 1.6,
            color: 'text.primary',
          }}
        >
          {segment.text}
        </Typography>
      </Stack>
    </Paper>
  );
}
