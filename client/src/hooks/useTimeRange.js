import { useState, useMemo } from 'react';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subWeeks,
    addWeeks,
    subMonths,
    addMonths,
    subYears,
    addYears,
    format,
    isSameWeek,
    isSameMonth,
    isSameYear,
    differenceInDays,
    differenceInWeeks,
    differenceInMonths
} from 'date-fns';
import { he } from 'date-fns/locale';

export const useTimeRange = (initialRange = 'month') => {
    const [currentRange, setCurrentRange] = useState(initialRange);
    const [currentDate, setCurrentDate] = useState(new Date());

    const timeRangeConfig = useMemo(() => {
        const now = currentDate;

        switch (currentRange) {
            case 'week':
                return {
                    start: startOfWeek(now, { weekStartsOn: 0 }), // ראשון
                    end: endOfWeek(now, { weekStartsOn: 0 }),
                    groupBy: 'day',
                    label: `שבוע ${format(now, 'dd/MM/yyyy', { locale: he })}`,
                    navigation: {
                        previous: () => setCurrentDate(subWeeks(now, 1)),
                        next: () => setCurrentDate(addWeeks(now, 1)),
                        canGoNext: differenceInWeeks(new Date(), now) > 0,
                    }
                };

            case 'month':
                return {
                    start: startOfMonth(now),
                    end: endOfMonth(now),
                    groupBy: 'week',
                    label: format(now, 'MMMM yyyy', { locale: he }),
                    navigation: {
                        previous: () => setCurrentDate(subMonths(now, 1)),
                        next: () => setCurrentDate(addMonths(now, 1)),
                        canGoNext: differenceInMonths(new Date(), now) > 0,
                    }
                };

            case 'year':
                return {
                    start: startOfYear(now),
                    end: endOfYear(now),
                    groupBy: 'month',
                    label: format(now, 'yyyy', { locale: he }),
                    navigation: {
                        previous: () => setCurrentDate(subYears(now, 1)),
                        next: () => setCurrentDate(addYears(now, 1)),
                        canGoNext: differenceInMonths(new Date(), now) > 11,
                    }
                };

            default:
                return {
                    start: startOfMonth(now),
                    end: endOfMonth(now),
                    groupBy: 'week',
                    label: format(now, 'MMMM yyyy', { locale: he }),
                    navigation: {
                        previous: () => setCurrentDate(subMonths(now, 1)),
                        next: () => setCurrentDate(addMonths(now, 1)),
                        canGoNext: differenceInMonths(new Date(), now) > 0,
                    }
                };
        }
    }, [currentRange, currentDate]);

    const changeRange = (newRange) => {
        setCurrentRange(newRange);
        setCurrentDate(new Date());
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const isCurrentPeriod = useMemo(() => {
        const now = new Date();
        switch (currentRange) {
            case 'week':
                return isSameWeek(now, currentDate, { weekStartsOn: 0 });
            case 'month':
                return isSameMonth(now, currentDate);
            case 'year':
                return isSameYear(now, currentDate);
            default:
                return false;
        }
    }, [currentRange, currentDate]);

    return {
        currentRange,
        currentDate,
        timeRangeConfig,
        changeRange,
        goToToday,
        isCurrentPeriod,
        // Helper functions
        formatDate: (date) => format(date, 'dd/MM/yyyy', { locale: he }),
        formatDateRange: (start, end) => {
            if (currentRange === 'week') {
                return `${format(start, 'dd/MM', { locale: he })} - ${format(end, 'dd/MM/yyyy', { locale: he })}`;
            }
            return `${format(start, 'dd/MM', { locale: he })} - ${format(end, 'dd/MM/yyyy', { locale: he })}`;
        }
    };
};
