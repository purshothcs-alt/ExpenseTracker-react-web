import { useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';
import { useAppSelector } from '@app/hooks';
import type { PropsWithChildren } from 'react';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const themeMode = useAppSelector(s => s.settings.settings.themeMode);
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
