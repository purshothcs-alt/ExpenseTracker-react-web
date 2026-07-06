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

const sharedComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { transition: 'background-color 0.3s ease, color 0.3s ease' },
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
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.18)', transform: 'translateY(-1px)' },
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
  MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  MuiDialog: {
    defaultProps: { TransitionComponent: Zoom },
    styleOverrides: {
      root: { '& .MuiBackdrop-root': { backdropFilter: 'blur(3px)' } },
      paper: {
        borderRadius: 16,
        boxShadow: '0 24px 48px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.08)',
      },
    },
  },
  MuiMenu: {
    defaultProps: { transitionDuration: 180 },
    styleOverrides: {
      paper: { borderRadius: 10, boxShadow: '0 12px 28px rgba(0,0,0,0.16)' },
    },
  },
  MuiPopover: {
    defaultProps: { transitionDuration: 180 },
    styleOverrides: { paper: { borderRadius: 10 } },
  },
  MuiTooltip: {
    defaultProps: { arrow: true },
    styleOverrides: { tooltip: { borderRadius: 6, fontSize: '0.7rem' } },
  },
  MuiTextField: { defaultProps: { size: 'small' as const, variant: 'outlined' as const } },
  MuiSelect: { defaultProps: { size: 'small' as const } },
  MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } } },
  MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
  MuiListItemButton: {
    styleOverrides: { root: { borderRadius: 8, transition: 'background-color 0.15s ease' } },
  },
  MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4 } } },
};

function darkOverrides(dividerColor: string) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: `1px solid ${dividerColor}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundImage: 'none', border: `1px solid ${dividerColor}` },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${dividerColor}`, backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderBottom: `1px solid ${dividerColor}` },
      },
    },
  };
}

function lightOverrides(dividerColor: string) {
  return {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderBottom: `1px solid ${dividerColor}` },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: `1px solid ${dividerColor}` } },
    },
  };
}

export const THEMES: Record<ThemeMode, { label: string; swatch: string }> = {
  ocean: { label: 'Ocean', swatch: '#2563EB' },
  forest: { label: 'Forest', swatch: '#059669' },
  midnight: { label: 'Midnight', swatch: '#0F172A' },
  sunset: { label: 'Sunset', swatch: '#EA580C' },
  royal: { label: 'Royal', swatch: '#7C3AED' },
  rose: { label: 'Rose', swatch: '#E11D48' },
};

export function createAppTheme(mode: ThemeMode = 'ocean'): Theme {
  switch (mode) {
    // ── Forest ── emerald green, nature-inspired light bg ──────────────────
    case 'forest':
      return createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#059669', light: '#10B981', dark: '#047857', contrastText: '#fff' },
          secondary: { main: '#0F766E', light: '#14B8A6', dark: '#0D5F5A', contrastText: '#fff' },
          success: { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
          warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
          error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
          info: { main: '#0891B2', light: '#06B6D4', dark: '#0E7490' },
          background: { default: '#F0FDF4', paper: '#FFFFFF' },
          text: { primary: '#052E16', secondary: '#166534' },
          divider: '#BBF7D0',
        },
        typography: baseTypography,
        shape: baseShape,
        components: { ...sharedComponents, ...lightOverrides('#BBF7D0') },
      });

    // ── Midnight ── deep navy dark with cyan/teal accents ──────────────────
    case 'midnight':
      return createTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#22D3EE', light: '#67E8F9', dark: '#06B6D4', contrastText: '#0F172A' },
          secondary: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#fff' },
          success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981' },
          warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B' },
          error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
          info: { main: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9' },
          background: { default: '#020617', paper: '#0F172A' },
          text: { primary: '#E2E8F0', secondary: '#64748B' },
          divider: 'rgba(34,211,238,0.08)',
        },
        typography: baseTypography,
        shape: baseShape,
        components: {
          ...sharedComponents,
          ...darkOverrides('rgba(34,211,238,0.08)'),
        },
      });

    // ── Sunset ── warm amber/orange, energetic and bold ────────────────────
    case 'sunset':
      return createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#EA580C', light: '#FB923C', dark: '#C2410C', contrastText: '#fff' },
          secondary: { main: '#EAB308', light: '#FACC15', dark: '#CA8A04', contrastText: '#fff' },
          success: { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
          warning: { main: '#B45309', light: '#D97706', dark: '#92400E' },
          error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
          info: { main: '#0284C7', light: '#0EA5E9', dark: '#0369A1' },
          background: { default: '#FFF7ED', paper: '#FFFFFF' },
          text: { primary: '#431407', secondary: '#9A3412' },
          divider: '#FED7AA',
        },
        typography: baseTypography,
        shape: baseShape,
        components: { ...sharedComponents, ...lightOverrides('#FED7AA') },
      });

    // ── Royal ── deep purple, premium and luxurious ────────────────────────
    case 'royal':
      return createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9', contrastText: '#fff' },
          secondary: { main: '#DB2777', light: '#EC4899', dark: '#BE185D', contrastText: '#fff' },
          success: { main: '#059669', light: '#10B981', dark: '#047857' },
          warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
          error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
          info: { main: '#0891B2', light: '#06B6D4', dark: '#0E7490' },
          background: { default: '#FAF5FF', paper: '#FFFFFF' },
          text: { primary: '#2E1065', secondary: '#6B21A8' },
          divider: '#E9D5FF',
        },
        typography: baseTypography,
        shape: baseShape,
        components: { ...sharedComponents, ...lightOverrides('#E9D5FF') },
      });

    // ── Rose ── rose/pink, modern and elegant ──────────────────────────────
    case 'rose':
      return createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#E11D48', light: '#FB7185', dark: '#BE123C', contrastText: '#fff' },
          secondary: { main: '#EC4899', light: '#F472B6', dark: '#DB2777', contrastText: '#fff' },
          success: { main: '#059669', light: '#10B981', dark: '#047857' },
          warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
          error: { main: '#9F1239', light: '#E11D48', dark: '#881337' },
          info: { main: '#0891B2', light: '#06B6D4', dark: '#0E7490' },
          background: { default: '#FFF1F2', paper: '#FFFFFF' },
          text: { primary: '#4C0519', secondary: '#9F1239' },
          divider: '#FECDD3',
        },
        typography: baseTypography,
        shape: baseShape,
        components: { ...sharedComponents, ...lightOverrides('#FECDD3') },
      });

    // ── Ocean (default) ── professional blue ────────────────────────────────
    default:
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
        components: { ...sharedComponents, ...lightOverrides('#E2E8F0') },
      });
  }
}
