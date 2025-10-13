import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FAB from './FAB';

const Layout = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Navbar onMenuClick={handleDrawerToggle} />
            <Sidebar mobileOpen={drawerOpen} onDrawerToggle={handleDrawerToggle} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: '100%',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
            <FAB />
        </Box>
    );
};

export default Layout;

