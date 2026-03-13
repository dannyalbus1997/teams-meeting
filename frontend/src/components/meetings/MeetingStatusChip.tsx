'use client';

import { Chip, ChipProps } from '@mui/material';
import { MeetingStatus } from '@/types';

interface MeetingStatusChipProps extends Omit<ChipProps, 'label'> {
  status: MeetingStatus;
}

/**
 * Status chip component with color coding for different meeting statuses
 */
export function MeetingStatusChip({ status, ...props }: MeetingStatusChipProps) {
  const statusConfig: Record<
    MeetingStatus,
    {
      label: string;
      color: ChipProps['color'];
    }
  > = {
    [MeetingStatus.DETECTED]: {
      label: 'Detected',
      color: 'default',
    },
    [MeetingStatus.TRANSCRIBING]: {
      label: 'Transcribing',
      color: 'info',
    },
    [MeetingStatus.ANALYZING]: {
      label: 'Analyzing',
      color: 'warning',
    },
    [MeetingStatus.COMPLETED]: {
      label: 'Completed',
      color: 'success',
    },
    [MeetingStatus.FAILED]: {
      label: 'Failed',
      color: 'error',
    },
  };

  const config = statusConfig[status];

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
