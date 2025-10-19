import { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import ProfileTab from './ProfileTab';
import HouseholdTab from './HouseholdTab';
import CategoriesTab from './CategoriesTab';
import PreferencesTab from './PreferencesTab';
import ThemeSelector from '../../components/settings/ThemeSelector';

const Settings = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                הגדרות
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
                נהל את הפרופיל, משק הבית והקטגוריות שלך
            </Typography>

            <Paper>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="פרופיל" />
                    <Tab label="משק בית" />
                    <Tab label="קטגוריות" />
                    <Tab label="העדפות" />
                    <Tab label="ערכת נושא" />
                </Tabs>

                <Box p={3}>
                    {activeTab === 0 && <ProfileTab />}
                    {activeTab === 1 && <HouseholdTab />}
                    {activeTab === 2 && <CategoriesTab />}
                    {activeTab === 3 && <PreferencesTab />}
                    {activeTab === 4 && <ThemeSelector />}
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings;

