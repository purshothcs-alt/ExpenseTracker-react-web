import { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  Button,
  Divider,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { removeNotification, clearNotifications } from '@app/uiSlice';

const SEVERITY_ICON = {
  success: <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />,
  error: <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />,
  warning: <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />,
  info: <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} />,
};

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.ui.notifications);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Badge badgeContent={notifications.length} color="error" max={9}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 480 } } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              sx={{ textTransform: 'none' }}
              onClick={() => dispatch(clearNotifications())}
            >
              Clear all
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box py={5} textAlign="center">
            <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              You're all caught up
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.map((n) => (
              <ListItem
                key={n.id}
                sx={{ alignItems: 'flex-start', gap: 1.25, py: 1.25, px: 2 }}
                secondaryAction={
                  <IconButton
                    size="small"
                    onClick={() => dispatch(removeNotification(n.id))}
                    aria-label="dismiss"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <Box mt={0.25}>{SEVERITY_ICON[n.severity]}</Box>
                <Box flex={1} minWidth={0} pr={3}>
                  <Typography variant="body2">{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
