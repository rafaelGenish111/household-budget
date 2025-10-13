import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
    return (
        <Card sx={{ height: '100%', bgcolor: color + '15' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={color}>
                            {value}
                        </Typography>
                        {trendValue && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {trend === 'up' ? (
                                    <TrendingUp fontSize="small" sx={{ color: '#4caf50', mr: 0.5 }} />
                                ) : (
                                    <TrendingDown fontSize="small" sx={{ color: '#f44336', mr: 0.5 }} />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    {trendValue}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: color,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatCard;

