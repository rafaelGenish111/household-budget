import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography, Box } from '@mui/material';

const CustomTooltip = ({ active, payload, label }) => {
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
                <Typography variant="body2" color="text.primary" gutterBottom>
                    {label}
                </Typography>
                {payload.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                bgcolor: entry.color,
                                borderRadius: '50%'
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {entry.name}: ₪{entry.value?.toLocaleString()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    }
    return null;
};

const CategoryBarChart = ({ data, title = "הוצאות לפי קטגוריה" }) => {
    if (!data || data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    אין נתונים להצגה
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: 400 }}>
            <Typography variant="h6" gutterBottom textAlign="center">
                {title}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₪${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="amount"
                        fill="#8884d8"
                        name="סכום"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default CategoryBarChart;
