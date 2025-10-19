import { Box, Typography, Grid, Card, CardContent, CardActionArea, Chip } from '@mui/material';
import { Check } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { categoryThemes, getThemeNames } from '../../themes/categoryThemes';

const ThemeSelector = () => {
    const { currentTheme, changeTheme } = useTheme();
    const themeNames = getThemeNames();

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                ערכת נושא
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                בחר ערכת נושא שתשפיע על צבעי הקטגוריות והממשק
            </Typography>

            <Grid container spacing={2}>
                {themeNames.map((themeName) => {
                    const theme = categoryThemes[themeName];
                    const isSelected = currentTheme === themeName;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={themeName}>
                            <Card
                                sx={{
                                    border: isSelected ? 3 : 1,
                                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                                    position: 'relative',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                <CardActionArea onClick={() => changeTheme(themeName)}>
                                    <CardContent>
                                        {isSelected && (
                                            <Chip
                                                icon={<Check />}
                                                label="נבחר"
                                                color="primary"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}
                                        <Typography variant="h6" gutterBottom>
                                            {theme.name}
                                        </Typography>

                                        {/* Preview of category colors */}
                                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={2}>
                                            {Object.entries(theme.categories)
                                                .slice(0, 8)
                                                .map(([name, config]) => (
                                                    <Box
                                                        key={name}
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            backgroundColor: config.color,
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '16px',
                                                            border: '1px solid',
                                                            borderColor: 'rgba(0,0,0,0.1)',
                                                        }}
                                                        title={name}
                                                    >
                                                        {config.icon}
                                                    </Box>
                                                ))}
                                        </Box>

                                        {/* Theme description */}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: 'block',
                                                mt: 1,
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {getThemeDescription(themeName)}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Current Theme Info */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    ערכת נושא נוכחית: {categoryThemes[currentTheme]?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {getThemeDescription(currentTheme)}
                </Typography>
            </Box>
        </Box>
    );
};

const getThemeDescription = (themeName) => {
    const descriptions = {
        light: 'עיצוב בהיר וקל לעיניים, מושלם לשימוש יומיומי',
        dark: 'מצב לילה עם צבעים כהים, חוסך בסוללה ומתאים לעבודה בלילה',
        colorful: 'עיצוב עליז וצבעוני עם הרבה אנרגיה וחיות',
        minimalist: 'עיצוב נקי ופשוט, מתמקד בתוכן ללא הסחות דעת',
        pastel: 'צבעים רכים ונעימים, מרגיע ונוח לעיניים',
        neon: 'עיצוב בולט ומודרני עם צבעים זוהרים וניאון',
    };
    return descriptions[themeName] || 'ערכת נושא מותאמת אישית';
};

export default ThemeSelector;
