'use client';

import { Chip, ChipProps } from '@mui/material';
import { MeetingStatus } from '@/types';

interface MeetingStatusChipProps extends Omit<ChipProps, 'label'> {
  status: MeetingStatus;
}

export function MeetingStatusChip({ status, ...props }: MeetingStatusChipProps) {
  const statusConfig: Record<MeetingStatus, { label: string; color: ChipProps['color'] }> = {
    [MeetingStatus.SYNCED]: { label: 'Synced', color: 'default' },
    [MeetingStatus.TRANSCRIPT_FETCHED]: { label: 'Transcript Ready', color: 'info' },
    [MeetingStatus.SUMMARIZED]: { label: 'Summarized', color: 'success' },
    [MeetingStatus.FAILED]: { label: 'Failed', color: 'error' },
  };

  const config = statusConfig[status] || { label: status, color: 'default' as const };

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant="outlined"
      size="small"
      {...props}
    />
  );
}
