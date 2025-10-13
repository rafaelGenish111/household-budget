import { createTheme } from '@mui/material/styles';
import { heIL } from '@mui/material/locale';

export const getTheme = (mode) =>
    createTheme(
        {
            direction: 'rtl',
            palette: {
                mode,
                primary: {
                    main: '#2196f3',
                    light: '#64b5f6',
                    dark: '#1976d2',
                },
                secondary: {
                    main: '#f50057',
                    light: '#ff4081',
                    dark: '#c51162',
                },
                income: {
                    main: '#4caf50',
                    light: '#81c784',
                    dark: '#388e3c',
                },
                expense: {
                    main: '#f44336',
                    light: '#e57373',
                    dark: '#d32f2f',
                },
                background: {
                    default: mode === 'dark' ? '#121212' : '#f5f5f5',
                    paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                },
            },
            typography: {
                fontFamily: 'Heebo, Arial, sans-serif',
                h1: {
                    fontSize: '2.5rem',
                    fontWeight: 700,
                },
                h2: {
                    fontSize: '2rem',
                    fontWeight: 600,
                },
                h3: {
                    fontSize: '1.75rem',
                    fontWeight: 600,
                },
                h4: {
                    fontSize: '1.5rem',
                    fontWeight: 500,
                },
                h5: {
                    fontSize: '1.25rem',
                    fontWeight: 500,
                },
                h6: {
                    fontSize: '1rem',
                    fontWeight: 500,
                },
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            textTransform: 'none',
                            borderRadius: 8,
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: mode === 'dark'
                                ? '0 4px 6px rgba(0, 0, 0, 0.3)'
                                : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        },
                    },
                },
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 8,
                            },
                        },
                    },
                },
            },
        },
        heIL
    );

