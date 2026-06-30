import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  useGetDashboardWidgetsQuery,
  useGetUserDashboardConfigQuery,
  useAddWidgetToDashboardMutation,
  useRemoveWidgetFromDashboardMutation,
} from '@app/api/dashboardApi';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DashboardCustomizer({ open, onClose }: Props) {
  const { data: allWidgets = [] } = useGetDashboardWidgetsQuery();
  const { data: configuredWidgets = [] } = useGetUserDashboardConfigQuery();
  const [addWidget] = useAddWidgetToDashboardMutation();
  const [removeWidget] = useRemoveWidgetFromDashboardMutation();

  const configuredWidgetIds = new Set(configuredWidgets.map((c) => c.widgetId));
  const availableWidgets = allWidgets.filter((w) => !configuredWidgetIds.has(w.id!));

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 380 } }}>
      <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight={700}>
          Customize Dashboard
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box p={2} flex={1} overflow="auto">
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          ACTIVE WIDGETS
        </Typography>
        {configuredWidgets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mb={2}>
            No widgets on dashboard
          </Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {configuredWidgets.map((config) => (
              <ListItem
                key={config.id}
                sx={{ bgcolor: 'background.default', borderRadius: 2, mb: 0.5, px: 1.5 }}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => removeWidget(config.id!)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      fontSize: 14,
                    }}
                  >
                    {config.widget?.icon?.[0] || 'W'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {config.widget?.name || 'Widget'}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {config.widget?.category}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          AVAILABLE WIDGETS
        </Typography>
        {availableWidgets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            All widgets are active
          </Typography>
        ) : (
          <List dense disablePadding>
            {availableWidgets.map((widget) => (
              <ListItem
                key={widget.id}
                sx={{ bgcolor: 'background.default', borderRadius: 2, mb: 0.5, px: 1.5 }}
                secondaryAction={
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => addWidget({ widgetId: widget.id! })}
                    sx={{ minWidth: 'unset', px: 1 }}
                  >
                    Add
                  </Button>
                }
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.hover', fontSize: 14 }}>
                    {widget.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {widget.name}
                    </Typography>
                  }
                  secondary={
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                      <Chip
                        label={widget.category}
                        size="small"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
