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
  Popover,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PaletteIcon from '@mui/icons-material/Palette';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toggleSidebar } from '@app/uiSlice';
import { saveSetting } from '@app/settingsSlice';
import { useInstallPrompt } from '@core/hooks/useInstallPrompt';
import { useApiLoading } from '@core/hooks/useApiLoading';
import { NotificationBell } from './NotificationBell';
import { THEMES } from '@core/theme/theme';
import type { ThemeMode } from '@core/database/types';

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
  const [paletteAnchor, setPaletteAnchor] = useState<HTMLElement | null>(null);
  const apiLoading = useApiLoading();

  const handleInstallClick = () => {
    if (canInstall) {
      void promptInstall();
    } else if (showIosInstructions) {
      setIosDialogOpen(true);
    }
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    void dispatch(saveSetting({ key: 'themeMode', value: mode }));
    setPaletteAnchor(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // Reserves space for the status bar on edge-to-edge Android (Capacitor
        // native build). 0 in every browser/PWA context, so this is a no-op there.
        pt: 'env(safe-area-inset-top)',
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

        <Tooltip title="Change Theme">
          <IconButton color="inherit" onClick={(e) => setPaletteAnchor(e.currentTarget)}>
            <PaletteIcon />
          </IconButton>
        </Tooltip>

        <NotificationBell />
      </Toolbar>

      <Fade in={apiLoading} unmountOnExit>
        <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 }} />
      </Fade>

      {/* Theme palette picker */}
      <Popover
        open={Boolean(paletteAnchor)}
        anchorEl={paletteAnchor}
        onClose={() => setPaletteAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box p={2} width={220}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            display="block"
            mb={1.5}
            textTransform="uppercase"
            letterSpacing={1}
          >
            Choose Theme
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1.25}>
            {(Object.entries(THEMES) as [ThemeMode, { label: string; swatch: string }][]).map(
              ([key, { label, swatch }]) => (
                <Tooltip key={key} title={label} placement="top">
                  <Box
                    onClick={() => handleThemeSelect(key)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: swatch,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: themeMode === key ? '3px solid' : '2px solid transparent',
                      borderColor: themeMode === key ? 'text.primary' : 'transparent',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                      },
                    }}
                  >
                    {themeMode === key && (
                      <CheckIcon
                        sx={{
                          fontSize: 16,
                          color: '#fff',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              ),
            )}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={1.5}
            textAlign="center"
          >
            {THEMES[themeMode]?.label ?? 'Ocean'}
          </Typography>
        </Box>
      </Popover>

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
