import { Box, Typography, FormControlLabel, Switch, MenuItem, TextField, Grid } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';

const PreferencesTab = () => {
    const dispatch = useDispatch();
    const { mode } = useSelector((state) => state.theme);

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                העדפות כלליות
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Switch checked={mode === 'dark'} onChange={handleThemeToggle} />}
                        label="מצב כהה"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="מטבע" defaultValue="ILS">
                        <MenuItem value="ILS">₪ שקל</MenuItem>
                        <MenuItem value="USD">$ דולר</MenuItem>
                        <MenuItem value="EUR">€ יורו</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="פורמט תאריך" defaultValue="dd/MM/yyyy">
                        <MenuItem value="dd/MM/yyyy">יום/חודש/שנה</MenuItem>
                        <MenuItem value="MM/dd/yyyy">חודש/יום/שנה</MenuItem>
                        <MenuItem value="yyyy-MM-dd">שנה-חודש-יום</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                        השינויים נשמרים אוטומטית
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PreferencesTab;

