import {
    Box,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Typography,
    Chip,
    Tooltip
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today,
    ViewWeek,
    CalendarMonth,
    CalendarViewYear
} from '@mui/icons-material';
import { useTimeRange } from '../../hooks/useTimeRange';

const TimeRangeSelector = () => {
    const {
        currentRange,
        timeRangeConfig,
        changeRange,
        goToToday,
        isCurrentPeriod,
        navigation
    } = useTimeRange();

    const getRangeIcon = (range) => {
        switch (range) {
            case 'week': return <ViewWeek />;
            case 'month': return <CalendarMonth />;
            case 'year': return <CalendarViewYear />;
            default: return <CalendarMonth />;
        }
    };

    const getRangeLabel = (range) => {
        switch (range) {
            case 'week': return 'שבועי';
            case 'month': return 'חודשי';
            case 'year': return 'שנתי';
            default: return 'חודשי';
        }
    };

    return (
        <Box sx={{ mb: 3 }}>
            {/* Range Type Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ToggleButtonGroup
                    value={currentRange}
                    exclusive
                    onChange={(e, newRange) => newRange && changeRange(newRange)}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            border: '1px solid',
                            borderColor: 'divider',
                            '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                },
                            },
                        },
                    }}
                >
                    {['week', 'month', 'year'].map((range) => (
                        <ToggleButton key={range} value={range}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getRangeIcon(range)}
                                <Typography variant="body2" sx={{ mr: 0.5 }}>
                                    {getRangeLabel(range)}
                                </Typography>
                            </Box>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {/* Current Period Display and Navigation */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
            }}>
                {/* Previous Button */}
                <Tooltip title="תקופה קודמת">
                    <IconButton
                        onClick={navigation.previous}
                        size="small"
                        sx={{
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        <ChevronRight />
                    </IconButton>
                </Tooltip>

                {/* Current Period Info */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 200
                }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        {timeRangeConfig.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                        {isCurrentPeriod && (
                            <Chip
                                label="תקופה נוכחית"
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        <Chip
                            label={getRangeLabel(currentRange)}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                {/* Next Button */}
                <Tooltip title="תקופה הבאה">
                    <IconButton
                        onClick={navigation.next}
                        disabled={!navigation.canGoNext}
                        size="small"
                        sx={{
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                            '&:disabled': {
                                opacity: 0.5,
                            }
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Today Button */}
            {!isCurrentPeriod && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Tooltip title="חזור לתקופה הנוכחית">
                        <Chip
                            icon={<Today />}
                            label="היום"
                            onClick={goToToday}
                            clickable
                            color="primary"
                            variant="outlined"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                }
                            }}
                        />
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
};

export default TimeRangeSelector;
