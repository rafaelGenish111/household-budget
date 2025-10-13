import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
} from '@mui/material';
import {
    Dashboard,
    Receipt,
    Savings,
    AccountBalance,
    TrackChanges,
    Settings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
    { text: 'לוח בקרה', icon: <Dashboard />, path: '/dashboard' },
    { text: 'תנועות', icon: <Receipt />, path: '/transactions' },
    { text: 'חסכונות', icon: <Savings />, path: '/savings' },
    { text: 'התחייבויות', icon: <AccountBalance />, path: '/commitments' },
    { text: 'יעדי תקציב', icon: <TrackChanges />, path: '/goals' },
    { text: 'הגדרות', icon: <Settings />, path: '/settings' },
];

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const drawer = (
        <>
            <Toolbar />
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (onDrawerToggle) onDrawerToggle();
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    );

    return (
        <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={onDrawerToggle}
            anchor="right"
            ModalProps={{ keepMounted: true }}
            sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
                },
            }}
        >
            {drawer}
        </Drawer>
    );
};

export default Sidebar;

