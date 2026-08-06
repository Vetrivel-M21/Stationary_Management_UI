import { createTheme } from '@mui/material/styles';

const metallicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2B6CB0', // Steel Blue
      dark: '#1A4971',
      light: '#4299E1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A5568', // Slate Gray
      dark: '#2D3748',
      light: '#718096',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F4F6F8', // Cool Metallic Light Background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C', // Gunmetal text
      secondary: '#4A5568',
    },
    divider: '#CBD5E0', // Silver divider
    info: {
      main: '#3182CE',
    },
    success: {
      main: '#2F855A',
    },
    warning: {
      main: '#DD6B20',
    },
    error: {
      main: '#E53E3E',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    fontSize: 13,
    htmlFontSize: 16,
    h1: { fontSize: '1.5rem', fontWeight: 700, color: '#1A202C' },
    h2: { fontSize: '1.35rem', fontWeight: 700, color: '#1A202C' },
    h3: { fontSize: '1.2rem', fontWeight: 600, color: '#1A202C' },
    h4: { fontSize: '1.1rem', fontWeight: 600, color: '#1A202C' },
    h5: { fontSize: '0.95rem', fontWeight: 600, color: '#1A202C' },
    h6: { fontSize: '0.85rem', fontWeight: 600, color: '#1A202C' },
    subtitle1: { fontSize: '0.85rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8rem', fontWeight: 500 },
    body1: { fontSize: '0.825rem', lineHeight: 1.4 },
    body2: { fontSize: '0.775rem', lineHeight: 1.4 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.825rem' },
    caption: { fontSize: '0.725rem' },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: '14px',
        },
        body: {
          fontSize: '0.825rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 34,
          paddingLeft: 16,
          paddingRight: 16,
          fontSize: '0.825rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
        sizeSmall: {
          minHeight: 28,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#2D3748',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '0.825rem',
          padding: '8px 12px',
        },
        body: {
          fontSize: '0.825rem',
          padding: '8px 12px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.825rem',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.825rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default metallicTheme;
