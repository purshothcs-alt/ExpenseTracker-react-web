import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppSettings, ThemeMode } from '@core/database/types';
import db from '@core/database/db';

const defaultSettings: AppSettings = {
  appName: 'Expense Tracker Pro',
  currency: 'INR',
  currencySymbol: '₹',
  themeMode: 'light',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  weekStartDay: 1,
  decimalSeparator: '.',
  thousandSeparator: ',',
  decimalPlaces: 2,
  showCents: true,
  compactMode: false,
  enableBudgetAlerts: true,
  enableGoalReminders: true,
  enableLoanDueAlerts: true,
  autoBackup: false,
};

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
}

const initialState: SettingsState = {
  settings: defaultSettings,
  loading: false,
};

export const loadSettings = createAsyncThunk('settings/load', async () => {
  const rows = await db.settings.toArray();
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });

  return {
    appName: map.appName || defaultSettings.appName,
    currency: map.currency || defaultSettings.currency,
    currencySymbol: map.currencySymbol || defaultSettings.currencySymbol,
    themeMode: (map.themeMode as ThemeMode) || defaultSettings.themeMode,
    dateFormat: map.dateFormat || defaultSettings.dateFormat,
    language: map.language || defaultSettings.language,
    weekStartDay: Number(map.weekStartDay ?? defaultSettings.weekStartDay),
    decimalSeparator: map.decimalSeparator || defaultSettings.decimalSeparator,
    thousandSeparator: map.thousandSeparator || defaultSettings.thousandSeparator,
    decimalPlaces: Number(map.decimalPlaces ?? defaultSettings.decimalPlaces),
    showCents: map.showCents !== 'false',
    compactMode: map.compactMode === 'true',
    enableBudgetAlerts: map.enableBudgetAlerts !== 'false',
    enableGoalReminders: map.enableGoalReminders !== 'false',
    enableLoanDueAlerts: map.enableLoanDueAlerts !== 'false',
    autoBackup: map.autoBackup === 'true',
    defaultAccountId: map.defaultAccountId ? Number(map.defaultAccountId) : undefined,
  } satisfies AppSettings;
});

export const saveSetting = createAsyncThunk(
  'settings/saveSetting',
  async ({ key, value }: { key: string; value: string }) => {
    await db.settings.put({ key, value, updatedAt: new Date().toISOString() });
    return { key, value };
  },
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSetting<K extends keyof AppSettings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: AppSettings[K] }>,
    ) {
      (state.settings[action.payload.key] as AppSettings[K]) = action.payload.value;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadSettings.pending, state => { state.loading = true; })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading = false;
      })
      .addCase(loadSettings.rejected, state => { state.loading = false; })
      .addCase(saveSetting.fulfilled, (state, action) => {
        const { key, value } = action.payload;
        if (key in state.settings) {
          (state.settings as Record<string, unknown>)[key] = value;
        }
      });
  },
});

export const { updateSetting } = settingsSlice.actions;
export default settingsSlice.reducer;
