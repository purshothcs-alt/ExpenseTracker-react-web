import { useState } from 'react';
import { NavLink } from 'react-router';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  LinearProgress,
  Fade,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toggleSidebar } from '@app/uiSlice';
import { saveSetting } from '@app/settingsSlice';
import { useInstallPrompt } from '@core/hooks/useInstallPrompt';
import { useApiLoading } from '@core/hooks/useApiLoading';
import { NotificationBell } from './NotificationBell';

const DRAWER_WIDTH = 260;

interface Props {
  open: boolean;
}

export function TopBar({ open }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode, appName } = useAppSelector((s) => s.settings.settings);
  const { canInstall, showIosInstructions, promptInstall } = useInstallPrompt();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const apiLoading = useApiLoading();

  const handleThemeToggle = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    void dispatch(saveSetting({ key: 'themeMode', value: next }));
  };

  const handleInstallClick = () => {
    if (canInstall) {
      void promptInstall();
    } else if (showIosInstructions) {
      setIosDialogOpen(true);
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open &&
          !isMobile && {
            marginLeft: DRAWER_WIDTH,
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" onClick={() => dispatch(toggleSidebar())} aria-label="toggle menu">
          <MenuIcon />
        </IconButton>

        {isMobile && (
          <Typography
            component={NavLink}
            to="/"
            variant="subtitle1"
            fontWeight={700}
            sx={{ flexGrow: 0, mr: 1, color: 'inherit', textDecoration: 'none' }}
            aria-label="Go to dashboard"
          >
            {appName}
          </Typography>
        )}

        <Box flex={1} />

        {(canInstall || showIosInstructions) && (
          <Tooltip title={t('pwa.installApp')}>
            <IconButton onClick={handleInstallClick} color="inherit">
              <InstallMobileIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <IconButton onClick={handleThemeToggle} color="inherit">
            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <NotificationBell />
      </Toolbar>

      <Fade in={apiLoading} unmountOnExit>
        <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 }} />
      </Fade>

      <Dialog open={iosDialogOpen} onClose={() => setIosDialogOpen(false)}>
        <DialogTitle>{t('pwa.iosInstallTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('pwa.iosInstallInstructions')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIosDialogOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
