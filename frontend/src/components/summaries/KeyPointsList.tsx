'use client';

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';

interface KeyPointsListProps {
  items: string[];
}

/**
 * Component displaying key points as a bulleted list with icons
 */
export function KeyPointsList({ items }: KeyPointsListProps) {
  if (items.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
        No key points available
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {items.map((point, index) => (
        <ListItem key={index} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LightbulbIcon
              sx={{
                color: 'warning.main',
                fontSize: 20,
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={point}
            primaryTypographyProps={{
              variant: 'body2',
              sx: { color: 'text.primary' },
            }}
          />
        </ListItem>
      ))}
    </List>
  );
}
