import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toggleSidebar } from '@app/uiSlice';
import { saveSetting } from '@app/settingsSlice';

const DRAWER_WIDTH = 260;

interface Props {
  open: boolean;
}

export function TopBar({ open }: Props) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode, appName } = useAppSelector((s) => s.settings.settings);

  const handleThemeToggle = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    void dispatch(saveSetting({ key: 'themeMode', value: next }));
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
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 0, mr: 1 }}>
            {appName}
          </Typography>
        )}

        <Box flex={1} />

        <Tooltip title={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <IconButton onClick={handleThemeToggle} color="inherit">
            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton color="inherit">
            <NotificationsNoneIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
