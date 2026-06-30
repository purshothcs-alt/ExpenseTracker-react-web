import { createTheme, type Theme } from '@mui/material/styles';
import Zoom from '@mui/material/Zoom';
import type { ThemeMode } from '@core/database/types';

const baseTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.01em' },
  h3: { fontWeight: 600, fontSize: '1.5rem' },
  h4: { fontWeight: 600, fontSize: '1.25rem' },
  h5: { fontWeight: 600, fontSize: '1.125rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500 },
  body1: { fontSize: '0.9375rem' },
  body2: { fontSize: '0.875rem' },
  button: { fontWeight: 600, textTransform: 'none' as const },
  caption: { fontSize: '0.75rem' },
};

const baseShape = { borderRadius: 10 };

const baseComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: 'background-color 0.25s ease, color 0.25s ease',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 20px',
        boxShadow: 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
        '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
        '&:active': { transform: 'translateY(0)' },
      },
      contained: {
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'translateY(-1px)' },
        '&:active': { boxShadow: 'none', transform: 'translateY(0)' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiDialog: {
    defaultProps: {
      TransitionComponent: Zoom,
    },
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow: '0 24px 48px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: { backdropFilter: 'blur(2px)' },
    },
  },
  MuiMenu: {
    defaultProps: {
      transitionDuration: 180,
    },
    styleOverrides: {
      paper: {
        borderRadius: 10,
        boxShadow: '0 12px 28px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  MuiPopover: {
    defaultProps: {
      transitionDuration: 180,
    },
    styleOverrides: {
      paper: { borderRadius: 10 },
    },
  },
  MuiTooltip: {
    defaultProps: {
      arrow: true,
    },
    styleOverrides: {
      tooltip: { borderRadius: 6, fontSize: '0.7rem' },
    },
  },
  MuiTextField: {
    defaultProps: { size: 'small' as const, variant: 'outlined' as const },
  },
  MuiSelect: {
    defaultProps: { size: 'small' as const },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 6, fontWeight: 500 },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: { fontWeight: 600 },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: { borderRadius: 8, transition: 'background-color 0.15s ease' },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 4 },
    },
  },
};

export function createAppTheme(mode: ThemeMode = 'light'): Theme {
  const resolvedMode =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;

  if (resolvedMode === 'dark') {
    return createTheme({
      palette: {
        mode: 'dark',
        primary: { main: '#5B8DEF', light: '#82A9F4', dark: '#3B6EDB', contrastText: '#fff' },
        secondary: { main: '#7C6AF0', light: '#9C8DF4', dark: '#5C4ECC', contrastText: '#fff' },
        success: { main: '#4CAF79', light: '#6FBF96', dark: '#3A9060' },
        warning: { main: '#F59E0B', light: '#FBB83E', dark: '#D97706' },
        error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
        info: { main: '#06B6D4', light: '#22D3EE', dark: '#0891B2' },
        background: { default: '#0F172A', paper: '#1E293B' },
        text: { primary: '#F1F5F9', secondary: '#94A3B8' },
        divider: 'rgba(241,245,249,0.08)',
      },
      typography: baseTypography,
      shape: baseShape,
      components: {
        ...baseComponents,
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: 'none',
              border: '1px solid rgba(241,245,249,0.06)',
              backgroundImage: 'none',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundImage: 'none',
              border: '1px solid rgba(241,245,249,0.06)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: '1px solid rgba(241,245,249,0.06)',
              backgroundImage: 'none',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderBottom: '1px solid rgba(241,245,249,0.06)',
            },
          },
        },
      },
    });
  }

  return createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' },
      secondary: { main: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9', contrastText: '#fff' },
      success: { main: '#059669', light: '#10B981', dark: '#047857' },
      warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
      error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
      info: { main: '#0891B2', light: '#06B6D4', dark: '#0E7490' },
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#64748B' },
      divider: '#E2E8F0',
    },
    typography: baseTypography,
    shape: baseShape,
    components: {
      ...baseComponents,
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: '1px solid #E2E8F0',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRight: '1px solid #E2E8F0' },
        },
      },
    },
  });
}
