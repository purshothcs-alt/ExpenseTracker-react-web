import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Typography, Divider, useTheme, alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import FlagIcon from '@mui/icons-material/Flag';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import DiamondIcon from '@mui/icons-material/Diamond';
import ConstructionIcon from '@mui/icons-material/Construction';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@app/hooks';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'accounts', path: '/accounts', icon: <AccountBalanceIcon /> },
  { label: 'transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
  { label: 'budgets', path: '/budgets', icon: <DonutLargeIcon /> },
  { label: 'goals', path: '/goals', icon: <FlagIcon /> },
  { label: 'loans', path: '/loans', icon: <MoneyOffIcon /> },
  { label: 'assets', path: '/assets', icon: <DiamondIcon /> },
  { label: 'projects', path: '/projects', icon: <ConstructionIcon /> },
  { label: 'reports', path: '/reports', icon: <AssessmentIcon /> },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'settings', path: '/settings', icon: <SettingsIcon /> },
  { label: 'administration', path: '/administration', icon: <AdminPanelSettingsIcon /> },
];

interface NavItemProps {
  item: NavItem;
}

function NavItemComponent({ item }: NavItemProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const isActive = item.path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.path);

  if (item.children) {
    return (
      <>
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            onClick={() => setOpen(!open)}
            sx={{
              borderRadius: 2, mx: 1,
              bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
              color: isActive ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={<Typography variant="body2" fontWeight={isActive ? 600 : 400}>{t(`nav.${item.label}`)}</Typography>} />
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={{ pl: 3 }}>
            {item.children.map(child => <NavItemComponent key={child.path} item={child} />)}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          borderRadius: 2, mx: 1,
          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
          color: isActive ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          '&.active': { bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' },
        }}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
        <ListItemText primary={<Typography variant="body2" fontWeight={isActive ? 600 : 400}>{t(`nav.${item.label}`)}</Typography>} />
      </ListItemButton>
    </ListItem>
  );
}

export function Navigation() {
  const { t } = useTranslation();
  const appName = useAppSelector(s => s.settings.settings.appName);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountCircleIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>{appName}</Typography>
            <Typography variant="caption" color="text.secondary">Finance Manager</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        <Typography variant="overline" sx={{ px: 3, display: 'block', mb: 0.5, color: 'text.disabled', fontSize: '0.625rem', letterSpacing: 1.5 }}>
          Main Menu
        </Typography>
        <List dense disablePadding>
          {NAV_ITEMS.map(item => <NavItemComponent key={item.path} item={item} />)}
        </List>

        <Divider sx={{ mx: 2, my: 1.5 }} />

        <Typography variant="overline" sx={{ px: 3, display: 'block', mb: 0.5, color: 'text.disabled', fontSize: '0.625rem', letterSpacing: 1.5 }}>
          {t('common.actions')}
        </Typography>
        <List dense disablePadding>
          {ADMIN_ITEMS.map(item => <NavItemComponent key={item.path} item={item} />)}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Expense Tracker Pro v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}
