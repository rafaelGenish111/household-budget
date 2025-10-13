import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

// פורמט תאריך לעברית
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: he });
};

// פורמט תאריך קצר
export const formatDateShort = (date) => {
    return formatDate(date, 'dd/MM');
};

// פורמט תאריך ארוך
export const formatDateLong = (date) => {
    return formatDate(date, 'dd MMMM yyyy');
};

// קבלת חודש נוכחי בפורמט YYYY-MM
export const getCurrentMonth = () => {
    return format(new Date(), 'yyyy-MM');
};

// קבלת חודש קודם
export const getPreviousMonth = () => {
    return format(subMonths(new Date(), 1), 'yyyy-MM');
};

// יצירת רשימת חודשים (למגמות)
export const getMonthsList = (monthsBack = 6) => {
    const end = new Date();
    const start = subMonths(end, monthsBack);

    return eachMonthOfInterval({ start, end }).map(date => ({
        month: format(date, 'yyyy-MM'),
        label: format(date, 'MMM yyyy', { locale: he }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
    }));
};

// בדיקה אם תאריך הוא היום
export const isToday = (date) => {
    const today = new Date();
    const checkDate = typeof date === 'string' ? parseISO(date) : date;
    return format(today, 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd');
};

// בדיקה אם תאריך הוא השבוע
export const isThisWeek = (date) => {
    const today = new Date();
    const checkDate = typeof date === 'string' ? parseISO(date) : date;
    const weekAgo = subMonths(today, 1);
    return checkDate >= weekAgo && checkDate <= today;
};

// קבלת שם יום בשבוע
export const getDayName = (date) => {
    return format(date, 'EEEE', { locale: he });
};

// קבלת שם חודש
export const getMonthName = (date) => {
    return format(date, 'MMMM', { locale: he });
};
