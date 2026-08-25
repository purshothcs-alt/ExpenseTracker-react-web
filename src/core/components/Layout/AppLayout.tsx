import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { TopBar } from './TopBar';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { setSidebarOpen } from '@app/uiSlice';
import { useNotificationGenerator } from '@core/hooks/useNotificationGenerator';
import { useNativeSmsListener } from '@core/hooks/useNativeSmsListener';

const DRAWER_WIDTH = 260;

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  useNotificationGenerator();
  useNativeSmsListener();

  const handleClose = () => dispatch(setSidebarOpen(false));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar open={sidebarOpen} />

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={handleClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
            },
          }}
        >
          <Navigation />
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open={sidebarOpen}
          sx={{
            width: sidebarOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: sidebarOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? DRAWER_WIDTH : 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: sidebarOpen
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
            },
          }}
        >
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <Navigation />
          </Box>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          // Base toolbar height (56px mobile / 64px desktop) plus the same
          // status-bar inset TopBar reserves, so content clears the fixed AppBar.
          pt: {
            xs: 'calc(56px + env(safe-area-inset-top))',
            sm: 'calc(64px + env(safe-area-inset-top))',
          },
          px: { xs: 2, md: 3 },
          pb: 3,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
