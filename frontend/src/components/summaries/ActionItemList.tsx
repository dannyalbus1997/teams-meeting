'use client';

import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import { TaskAlt as TaskAltIcon } from '@mui/icons-material';
import { ActionItem } from '@/types';
import { useToggleActionItem } from '@/hooks/useMeetings';

interface ActionItemListProps {
  items: ActionItem[];
  summaryId: string;
}

/**
 * Component displaying action items as a checklist
 */
export function ActionItemList({ items, summaryId }: ActionItemListProps) {
  const { mutate, isPending } = useToggleActionItem();

  const handleToggle = (index: number) => {
    mutate({
      summaryId,
      actionItemIndex: index,
      completed: !items[index].completed,
    });
  };

  const priorityConfig: Record<string, { color: 'default' | 'error' | 'warning' | 'success' }> = {
    high: { color: 'error' },
    medium: { color: 'warning' },
    low: { color: 'success' },
  };

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
        No action items
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {items.map((item, index) => (
        <ListItem
          key={index}
          sx={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': {
              borderBottom: 'none',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              width: '100%',
              gap: 1,
            }}
          >
            <Checkbox
              checked={item.completed}
              onChange={() => handleToggle(index)}
              disabled={isPending}
              sx={{ mt: 0.5 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'text.secondary' : 'text.primary',
                }}
              >
                {item.task}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Assigned to: {item.assignee}
              </Typography>
            </Box>
            {isPending && <CircularProgress size={20} />}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1, ml: 4, width: '100%' }}
          >
            <Chip
              label={item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              size="small"
              color={priorityConfig[item.priority].color}
              variant="outlined"
            />
            {item.deadline && (
              <Chip
                label={format(new Date(item.deadline), 'MMM d, yyyy')}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </ListItem>
      ))}
    </List>
  );
}
