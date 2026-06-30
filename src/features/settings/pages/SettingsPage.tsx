import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { PageHeader } from '@core/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { saveSetting } from '@app/settingsSlice';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@localization/i18n';
import { useState } from 'react';
import type { ThemeMode } from '@core/database/types';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: '2024-12-31' },
  { value: 'DD-MMM-YYYY', label: '31-Dec-2024' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
];

const WEEK_START_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  useTranslation();
  const settings = useAppSelector((s) => s.settings.settings);

  const [appName, setAppName] = useState(settings.appName);

  const handleSave = async (key: string, value: string | number | boolean) => {
    try {
      await dispatch(saveSetting({ key, value: String(value) })).unwrap();
      enqueueSnackbar('Setting saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save setting', { variant: 'error' });
    }
  };

  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang);
    await handleSave('language', lang);
  };

  const handleCurrencyChange = async (code: string) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (!cur) return;
    await dispatch(saveSetting({ key: 'currency', value: code })).unwrap();
    await dispatch(saveSetting({ key: 'currencySymbol', value: cur.symbol })).unwrap();
    enqueueSnackbar('Currency updated', { variant: 'success' });
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        icon={<SettingsIcon sx={{ fontSize: 28 }} />}
        subtitle="Customize your experience"
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                General
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="App Name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  onBlur={() => handleSave('appName', appName)}
                  size="small"
                  fullWidth
                />
                <TextField
                  select
                  label="Language"
                  value={settings.language || 'en'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  size="small"
                  fullWidth
                >
                  {LANGUAGES.map((l) => (
                    <MenuItem key={l.code} value={l.code}>
                      {l.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Date Format"
                  value={settings.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) => handleSave('dateFormat', e.target.value)}
                  size="small"
                  fullWidth
                >
                  {DATE_FORMATS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Week Starts On"
                  value={settings.weekStartDay ?? 1}
                  onChange={(e) => handleSave('weekStartDay', Number(e.target.value))}
                  size="small"
                  fullWidth
                >
                  {WEEK_START_DAYS.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Currency
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  select
                  label="Currency"
                  value={settings.currency || 'INR'}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  size="small"
                  fullWidth
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={c.symbol}
                          size="small"
                          sx={{ fontWeight: 700, minWidth: 36 }}
                        />
                        {c.name} ({c.code})
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  p={1.5}
                  bgcolor="action.hover"
                  borderRadius={1}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 18 }}>
                    {settings.currencySymbol || '₹'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {settings.currency || 'INR'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {CURRENCIES.find((c) => c.code === settings.currency)?.name || 'Indian Rupee'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Appearance
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  select
                  label="Theme"
                  value={settings.themeMode || 'light'}
                  onChange={(e) => handleSave('themeMode', e.target.value as ThemeMode)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </TextField>
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.compactMode}
                      onChange={(e) => handleSave('compactMode', e.target.checked)}
                    />
                  }
                  label="Compact Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.showCents}
                      onChange={(e) => handleSave('showCents', e.target.checked)}
                    />
                  }
                  label="Show decimal/paise in amounts"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Notifications
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableBudgetAlerts}
                      onChange={(e) => handleSave('enableBudgetAlerts', e.target.checked)}
                    />
                  }
                  label="Budget alerts when near limit"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableGoalReminders}
                      onChange={(e) => handleSave('enableGoalReminders', e.target.checked)}
                    />
                  }
                  label="Goal deadline reminders"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableLoanDueAlerts}
                      onChange={(e) => handleSave('enableLoanDueAlerts', e.target.checked)}
                    />
                  }
                  label="Loan due date alerts"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expense Tracker Pro — Version 1.0.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built with React 19, MUI v7, RTK Query, Dexie.js (IndexedDB)
              </Typography>
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                {['React 19', 'TypeScript', 'MUI v7', 'Redux Toolkit', 'Dexie.js', 'PWA'].map(
                  (t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" />
                  ),
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
