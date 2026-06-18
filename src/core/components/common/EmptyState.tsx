import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import type { ReactNode, SyntheticEvent } from 'react';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: (e: SyntheticEvent) => void;
  };
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      gap={2}
      textAlign="center"
    >
      <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 72 } }}>
        {icon || <InboxIcon />}
      </Box>
      <Typography variant="h6" color="text.secondary" fontWeight={600}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" maxWidth={400}>{description}</Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
