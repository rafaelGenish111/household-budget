import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Typography, Box } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                boxShadow: 2
            }}>
                <Typography variant="body2" color="text.primary">
                    {payload[0].name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ₪{payload[0].value?.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {payload[0].payload.percentage}%
                </Typography>
            </Box>
        );
    }
    return null;
};

const CustomLegend = ({ payload }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
            {payload.map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            bgcolor: entry.color,
                            borderRadius: '50%'
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {entry.value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

const ExpensePieChart = ({ data, title = "התפלגות הוצאות" }) => {
    if (!data || data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    אין נתונים להצגה
                </Typography>
            </Box>
        );
    }

    // חישוב אחוזים
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentage = data.map(item => ({
        ...item,
        percentage: ((item.value / total) * 100).toFixed(1)
    }));

    return (
        <Box sx={{ width: '100%', height: 400 }}>
            <Typography variant="h6" gutterBottom textAlign="center">
                {title}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={dataWithPercentage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {dataWithPercentage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default ExpensePieChart;
