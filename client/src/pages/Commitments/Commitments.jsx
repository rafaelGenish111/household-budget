import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Tabs, Tab, Paper } from '@mui/material';
import CommitmentsList from './CommitmentsList';
import DebtsTab from './DebtsTab';

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const Commitments = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = parseInt(searchParams.get('tab') || '0', 10);
    const [value, setValue] = useState(Number.isNaN(initialTab) ? 0 : initialTab);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newValue);
        window.history.replaceState({}, '', url);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Paper>
                    <Tabs value={value} onChange={handleChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label="מנויים קבועים" />
                        <Tab label="חובות והלוואות" />
                    </Tabs>

                    <TabPanel value={value} index={0}>
                        <CommitmentsList />
                    </TabPanel>

                    <TabPanel value={value} index={1}>
                        <DebtsTab />
                    </TabPanel>
                </Paper>
            </Box>
        </Container>
    );
};

export default Commitments;


