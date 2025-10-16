import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { defaultCategories } from '../utils/defaultCategories.js';

export const ensureDefaultCategories = async () => {
    try {
        // רוץ רק אם יש חיבור פעיל למסד
        if (mongoose.connection.readyState !== 1) {
            return;
        }
        const existingDefaults = await Category.find({ isDefault: true });

        if (existingDefaults.length === 0) {
            await Category.insertMany(defaultCategories);
            console.log('✅ Default categories created');
        } else {
            // בדוק אם יש קטגוריות חדשות להוסיף
            const existingNames = existingDefaults.map(cat => cat.name);
            const newCategories = defaultCategories.filter(
                cat => !existingNames.includes(cat.name)
            );

            if (newCategories.length > 0) {
                await Category.insertMany(newCategories);
                console.log(`✅ Added ${newCategories.length} new default categories`);
            }
        }
    } catch (error) {
        console.error('Error ensuring default categories:', error);
    }
};

