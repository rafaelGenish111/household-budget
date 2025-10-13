import * as yup from 'yup';

// סכמות ולידציה לטפסים

// לידציה להתחברות
export const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email('כתובת אימייל לא תקינה')
        .required('שדה חובה'),
    password: yup
        .string()
        .min(6, 'סיסמה חייבת להכיל לפחות 6 תווים')
        .required('שדה חובה')
});

// לידציה להרשמה
export const registerSchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה'),
    email: yup
        .string()
        .email('כתובת אימייל לא תקינה')
        .required('שדה חובה'),
    password: yup
        .string()
        .min(6, 'סיסמה חייבת להכיל לפחות 6 תווים')
        .required('שדה חובה'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'סיסמאות אינן תואמות')
        .required('שדה חובה')
});

// לידציה לתנועה
export const transactionSchema = yup.object().shape({
    type: yup
        .string()
        .oneOf(['income', 'expense'], 'בחר סוג תנועה')
        .required('שדה חובה'),
    category: yup
        .string()
        .required('שדה חובה'),
    subcategory: yup
        .string()
        .required('שדה חובה'),
    amount: yup
        .number()
        .positive('סכום חייב להיות חיובי')
        .required('שדה חובה'),
    date: yup
        .date()
        .required('שדה חובה'),
    description: yup
        .string()
        .max(200, 'תיאור ארוך מדי'),
    paymentMethod: yup
        .string()
        .required('שדה חובה'),
    installments: yup
        .number()
        .min(1, 'מספר תשלומים חייב להיות לפחות 1')
        .max(60, 'מספר תשלומים לא יכול לעלות על 60')
});

// לידציה לחסכון
export const savingSchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה'),
    goal: yup
        .number()
        .positive('יעד חייב להיות חיובי')
        .required('שדה חובה'),
    current: yup
        .number()
        .min(0, 'סכום נוכחי לא יכול להיות שלילי')
        .required('שדה חובה'),
    monthlyContribution: yup
        .number()
        .positive('תרומה חודשית חייבת להיות חיובית')
        .required('שדה חובה'),
    targetDate: yup
        .date()
        .min(new Date(), 'תאריך יעד חייב להיות בעתיד')
});

// לידציה להתחייבות
export const commitmentSchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה'),
    totalAmount: yup
        .number()
        .positive('סכום כולל חייב להיות חיובי')
        .required('שדה חובה'),
    monthlyPayment: yup
        .number()
        .positive('תשלום חודשי חייב להיות חיובי')
        .required('שדה חובה'),
    paymentsLeft: yup
        .number()
        .min(1, 'מספר תשלומים נותרים חייב להיות לפחות 1')
        .required('שדה חובה'),
    startDate: yup
        .date()
        .required('שדה חובה')
});

// לידציה ליעד תקציב
export const budgetGoalSchema = yup.object().shape({
    monthlyIncomeGoal: yup
        .number()
        .positive('יעד הכנסה חודשי חייב להיות חיובי')
        .required('שדה חובה'),
    categoryGoals: yup
        .object()
        .test('positive-values', 'כל יעד קטגוריה חייב להיות חיובי', function (values) {
            if (!values) return true;
            return Object.values(values).every(value =>
                value === null || value === undefined || value >= 0
            );
        })
});

// לידציה לקטגוריה
export const categorySchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה'),
    type: yup
        .string()
        .oneOf(['income', 'expense'], 'בחר סוג קטגוריה')
        .required('שדה חובה'),
    subcategories: yup
        .array()
        .of(yup.string().min(1, 'שם תת-קטגוריה לא יכול להיות ריק'))
        .min(1, 'יש להוסיף לפחות תת-קטגוריה אחת')
        .required('שדה חובה')
});

// לידציה למשק בית
export const householdSchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה')
});

// לידציה לפרופיל
export const profileSchema = yup.object().shape({
    name: yup
        .string()
        .min(2, 'שם חייב להכיל לפחות 2 תווים')
        .required('שדה חובה'),
    email: yup
        .string()
        .email('כתובת אימייל לא תקינה')
        .required('שדה חובה'),
    currentPassword: yup
        .string()
        .when('newPassword', {
            is: (newPassword) => newPassword && newPassword.length > 0,
            then: yup.string().required('סיסמה נוכחית נדרשת לשינוי סיסמה'),
            otherwise: yup.string()
        }),
    newPassword: yup
        .string()
        .min(6, 'סיסמה חדשה חייבת להכיל לפחות 6 תווים'),
    confirmNewPassword: yup
        .string()
        .when('newPassword', {
            is: (newPassword) => newPassword && newPassword.length > 0,
            then: yup.string()
                .oneOf([yup.ref('newPassword')], 'סיסמאות חדשות אינן תואמות')
                .required('אישור סיסמה נדרש'),
            otherwise: yup.string()
        })
});

// פונקציות עזר לולידציה

// בדיקת תקינות אימייל
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// בדיקת חוזק סיסמה
export const isStrongPassword = (password) => {
    // לפחות 6 תווים, לפחות אות אחת ומספר אחד
    const strongRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return strongRegex.test(password);
};

// בדיקת תקינות מספר טלפון ישראלי
export const isValidIsraeliPhone = (phone) => {
    const phoneRegex = /^(\+972|0)([23489]|5[012345689]|77)[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// בדיקת תקינות מספר זהות ישראלי
export const isValidIsraeliId = (id) => {
    if (!id || id.length !== 9) return false;

    let sum = 0;
    for (let i = 0; i < 8; i++) {
        let digit = parseInt(id[i]);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
        }
        sum += digit;
    }

    return (10 - (sum % 10)) % 10 === parseInt(id[8]);
};
