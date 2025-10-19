import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getTheme } from '../themes/categoryThemes';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('appTheme') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('appTheme', currentTheme);
    }, [currentTheme]);

    const themeConfig = useMemo(() => {
        const categoryTheme = getTheme(currentTheme);
        return createTheme({
            direction: 'rtl',
            palette: {
                mode: currentTheme === 'dark' || currentTheme === 'neon' ? 'dark' : 'light',
                ...categoryTheme.palette,
            },
            typography: {
                fontFamily: [
                    'Heebo',
                    'Rubik',
                    'Arial',
                    'sans-serif',
                ].join(','),
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundColor: categoryTheme.palette.background.default,
                        },
                    },
                },
            },
        });
    }, [currentTheme]);

    const changeTheme = (newTheme) => {
        setCurrentTheme(newTheme);
    };

    const getCategoryColor = (categoryName) => {
        const theme = getTheme(currentTheme);
        return theme.categories[categoryName]?.color || '#2196f3';
    };

    const getCategoryIcon = (categoryName) => {
        const theme = getTheme(currentTheme);
        return theme.categories[categoryName]?.icon || '📦';
    };

    const value = {
        currentTheme,
        changeTheme,
        getCategoryColor,
        getCategoryIcon,
        themeConfig,
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={themeConfig}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
