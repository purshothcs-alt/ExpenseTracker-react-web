import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { TopBar } from './TopBar';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { setSidebarOpen } from '@app/uiSlice';

const DRAWER_WIDTH = 260;

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          pt: { xs: 7, sm: 8 },
          px: { xs: 2, md: 3 },
          pb: 3,
          maxWidth: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
