import { createTheme } from '@mui/material/styles';

// Cores extraídas da logo
const colors = {
  primary: {
    main: '#ff2c19', // Vermelho principal
    light: '#ff5c4a',
    dark: '#e62816',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#25bf6a', // Verde principal
    light: '#4dd689',
    dark: '#20a65c',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ffbb02', // Amarelo
    light: '#ffd54f',
    dark: '#e8aa02',
    contrastText: '#011b49',
  },
  info: {
    main: '#011b49', // Azul escuro (texto)
    light: '#1a3d6b',
    dark: '#000d1f',
    contrastText: '#ffffff',
  },
  success: {
    main: '#25bf6a',
    light: '#4dd689',
    dark: '#20a65c',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ff2c19',
    light: '#ff5c4a',
    dark: '#e62816',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f5f7fa',
    paper: '#ffffff',
  },
  text: {
    primary: '#011b49',
    secondary: '#6b7280',
  },
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    error: colors.error,
    background: colors.background,
    text: colors.text,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: colors.info.main,
    },
    h2: {
      fontWeight: 700,
      color: colors.info.main,
    },
    h3: {
      fontWeight: 600,
      color: colors.info.main,
    },
    h4: {
      fontWeight: 600,
      color: colors.info.main,
    },
    h5: {
      fontWeight: 600,
      color: colors.info.main,
    },
    h6: {
      fontWeight: 600,
      color: colors.info.main,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.secondary.dark} 0%, ${colors.secondary.main} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(1, 27, 73, 0.08)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(1, 27, 73, 0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(1, 27, 73, 0.1)',
        },
      },
    },
  },
});

export default theme;

