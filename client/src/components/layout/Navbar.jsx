import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Avatar } from '@mui/material';
import {
    Menu as MenuIcon,
    Brightness4,
    Brightness7,
    AccountCircle,
    Logout,
} from '@mui/icons-material';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';

const Navbar = ({ onMenuClick }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { mode } = useSelector((state) => state.theme);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        handleClose();
    };

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                    title="חזרה לדף הבית"
                >
                    💰 ניהול משק בית
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton color="inherit" onClick={handleThemeToggle}>
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>

                    <IconButton color="inherit" onClick={handleMenu}>
                        {user?.name ? (
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {user.name.charAt(0)}
                            </Avatar>
                        ) : (
                            <AccountCircle />
                        )}
                    </IconButton>

                    <IconButton
                        color="inherit"
                        edge="end"
                        onClick={onMenuClick}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.name}</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                            <AccountCircle sx={{ mr: 1 }} />
                            הגדרות
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <Logout sx={{ mr: 1 }} />
                            התנתק
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;

