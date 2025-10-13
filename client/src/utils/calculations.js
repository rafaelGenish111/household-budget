// חישובי תקציב ויתרות

// חישוב סכום כולל של מערך
export const calculateTotal = (items, field = 'amount') => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (item[field] || 0), 0);
};

// חישוב יתרה (הכנסות - הוצאות)
export const calculateBalance = (income, expenses) => {
    return (income || 0) - (expenses || 0);
};

// חישוב אחוז מהסכום
export const calculatePercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
};

// חישוב יתרה נותרת לתקציב קטגוריה
export const calculateCategoryRemaining = (budget, spent) => {
    return (budget || 0) - (spent || 0);
};

// בדיקה אם חריגה מתקציב
export const isOverBudget = (spent, budget) => {
    return spent > budget;
};

// חישוב אחוז חריגה
export const getOverspendPercentage = (spent, budget) => {
    if (budget === 0) return 0;
    return ((spent - budget) / budget * 100).toFixed(1);
};

// חישוב מגמה (עלייה/ירידה באחוזים)
export const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
};

// חישוב תשלום חודשי עבור פריסה
export const calculateMonthlyPayment = (totalAmount, installments) => {
    if (!installments || installments <= 0) return totalAmount;
    return (totalAmount / installments).toFixed(2);
};

// חישוב התקדמות חסכון באחוזים
export const calculateSavingsProgress = (current, goal) => {
    if (!goal || goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100).toFixed(1);
};

// חישוב זמן עד השגת יעד החסכון
export const calculateTimeToGoal = (current, goal, monthlyContribution) => {
    if (!monthlyContribution || monthlyContribution <= 0) return null;
    const remaining = goal - current;
    if (remaining <= 0) return 0;

    const months = Math.ceil(remaining / monthlyContribution);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
        return `${years} שנים ו-${remainingMonths} חודשים`;
    } else if (years > 0) {
        return `${years} שנים`;
    } else {
        return `${months} חודשים`;
    }
};

// חישוב התקדמות פירעון התחייבות
export const calculateCommitmentProgress = (totalAmount, remaining) => {
    const paid = totalAmount - remaining;
    return calculatePercentage(paid, totalAmount);
};

// חישוב מספר תשלומים נותרים
export const calculateRemainingPayments = (paymentsLeft, monthlyPayment) => {
    if (!monthlyPayment || monthlyPayment <= 0) return 0;
    return paymentsLeft;
};

// חישוב זמן עד סיום התחייבות
export const calculateTimeToCompletion = (paymentsLeft) => {
    if (!paymentsLeft) return 0;

    const years = Math.floor(paymentsLeft / 12);
    const months = paymentsLeft % 12;

    if (years > 0 && months > 0) {
        return `${years} שנים ו-${months} חודשים`;
    } else if (years > 0) {
        return `${years} שנים`;
    } else {
        return `${months} חודשים`;
    }
};

// עיצוב סכום עם סימן ₪
export const formatCurrency = (amount, showSign = true) => {
    if (amount === null || amount === undefined) return '₪0';
    const formatted = Number(amount).toLocaleString('he-IL');
    return showSign ? `₪${formatted}` : formatted;
};

// עיצוב אחוז
export const formatPercentage = (percentage, showSign = true) => {
    if (percentage === null || percentage === undefined) return '0%';
    const formatted = Number(percentage).toFixed(1);
    return showSign ? `${formatted}%` : formatted;
};

// קבלת צבע לפי סטטוס תקציב
export const getBudgetColor = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage <= 80) return 'success';
    if (percentage <= 100) return 'warning';
    return 'error';
};

// קבלת צבע לפי מגמה
export const getTrendColor = (trend) => {
    if (trend > 0) return 'success';
    if (trend < 0) return 'error';
    return 'default';
};
