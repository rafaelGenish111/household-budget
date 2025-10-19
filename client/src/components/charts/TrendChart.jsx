import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../../services/statisticsService';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TrendChart = ({ data, loading, error, title = 'מגמות הוצאות והכנסות' }) => {
    const theme = useTheme();

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                שגיאה בטעינת נתוני המגמות: {error}
            </Alert>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography variant="h6" color="text.secondary">
                    אין נתונים לתצוגה
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    הוסף עסקאות כדי לראות מגמות
                </Typography>
            </Box>
        );
    }

    const chartData = {
        labels: data.map(item => {
            // Format date based on the data structure
            const date = new Date(item.date);
            return date.toLocaleDateString('he-IL', {
                day: '2-digit',
                month: '2-digit',
                year: data.length > 30 ? '2-digit' : undefined
            });
        }),
        datasets: [
            {
                label: 'הכנסות',
                data: data.map(item => item.income),
                borderColor: theme.palette.success.main,
                backgroundColor: theme.palette.success.main + '20',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: theme.palette.success.main,
                pointBorderColor: theme.palette.success.main,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'הוצאות',
                data: data.map(item => item.expenses),
                borderColor: theme.palette.error.main,
                backgroundColor: theme.palette.error.main + '20',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: theme.palette.error.main,
                pointBorderColor: theme.palette.error.main,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'יתרה',
                data: data.map(item => item.balance),
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '20',
                fill: '+1',
                tension: 0.4,
                pointBackgroundColor: theme.palette.primary.main,
                pointBorderColor: theme.palette.primary.main,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: theme.typography.fontFamily,
                        size: 12,
                    },
                },
            },
            title: {
                display: true,
                text: title,
                font: {
                    family: theme.typography.fontFamily,
                    size: 16,
                    weight: 'bold',
                },
                color: theme.palette.text.primary,
            },
            tooltip: {
                backgroundColor: theme.palette.background.paper,
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const value = context.parsed.y;
                        return `${context.dataset.label}: ${formatCurrency(value)}`;
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'תאריך',
                    color: theme.palette.text.secondary,
                    font: {
                        family: theme.typography.fontFamily,
                        size: 12,
                    },
                },
                ticks: {
                    color: theme.palette.text.secondary,
                    font: {
                        family: theme.typography.fontFamily,
                        size: 11,
                    },
                    maxRotation: 45,
                },
                grid: {
                    color: theme.palette.divider,
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'סכום (₪)',
                    color: theme.palette.text.secondary,
                    font: {
                        family: theme.typography.fontFamily,
                        size: 12,
                    },
                },
                ticks: {
                    color: theme.palette.text.secondary,
                    font: {
                        family: theme.typography.fontFamily,
                        size: 11,
                    },
                    callback: function (value) {
                        return formatCurrency(value);
                    },
                },
                grid: {
                    color: theme.palette.divider,
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        elements: {
            point: {
                hoverBackgroundColor: '#fff',
                hoverBorderWidth: 2,
            },
        },
    };

    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <Line data={chartData} options={options} />
        </Box>
    );
};

export default TrendChart;
