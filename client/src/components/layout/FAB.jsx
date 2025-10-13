import { useState } from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FAB = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            icon: <TrendingUp sx={{ color: '#4caf50' }} />,
            name: 'הכנסה חדשה',
            color: '#4caf50',
            onClick: () => navigate('/transactions?type=income&new=true'),
        },
        {
            icon: <TrendingDown sx={{ color: '#f44336' }} />,
            name: 'הוצאה חדשה',
            color: '#f44336',
            onClick: () => navigate('/transactions?type=expense&new=true'),
        },
    ];

    return (
        <SpeedDial
            ariaLabel="הוסף תנועה"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
            direction="up"
        >
            {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={() => {
                        action.onClick();
                        setOpen(false);
                    }}
                    FabProps={{
                        sx: {
                            bgcolor: action.color,
                            '&:hover': { bgcolor: action.color, opacity: 0.9 },
                        },
                    }}
                />
            ))}
        </SpeedDial>
    );
};

export default FAB;

