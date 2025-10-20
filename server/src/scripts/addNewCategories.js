import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Household from '../models/Household.js';
import { defaultCategories } from '../utils/defaultCategories.js';

dotenv.config();

const addNewCategories = async () => {
    try {
        await connectDB();
        console.log('🔄 Adding new categories to existing households...\n');

        // Get all households
        const households = await Household.find({});
        console.log(`📋 Found ${households.length} households\n`);

        // New categories to add
        const newCategories = [
            {
                name: 'שירותים דיגיטליים',
                type: 'expense',
                subcategories: ['נטפליקס', 'ספוטיפיי', 'אפל מיוזיק', 'יוטיוב פרמיום', 'אמזון פריים', 'דיסני+', 'הולו', 'אחר'],
                icon: '📱',
                color: '#6c5ce7',
                isDefault: true,
            },
            {
                name: 'כושר ובריאות',
                type: 'expense',
                subcategories: ['חדר כושר', 'יוגה', 'פילאטיס', 'בריכה', 'פיזיותרפיה', 'מאמן אישי', 'אחר'],
                icon: '💪',
                color: '#00b894',
                isDefault: true,
            },
            {
                name: 'ביטוחים',
                type: 'expense',
                subcategories: ['ביטוח רכב', 'ביטוח דירה', 'ביטוח חיים', 'ביטוח בריאות פרטי', 'ביטוח נסיעות', 'אחר'],
                icon: '🛡️',
                color: '#0984e3',
                isDefault: true,
            },
            {
                name: 'מנויים ומינויים',
                type: 'expense',
                subcategories: ['עיתונים', 'מגזינים', 'קלובים', 'חברות', 'אפליקציות', 'אחר'],
                icon: '📰',
                color: '#fd79a8',
                isDefault: true,
            },
            {
                name: 'תחזוקת בית',
                type: 'expense',
                subcategories: ['ניקיון', 'גינון', 'שיפוצים', 'תיקונים', 'אביזרים', 'אחר'],
                icon: '🔧',
                color: '#f39c12',
                isDefault: true,
            },
            {
                name: 'חיות מחמד',
                type: 'expense',
                subcategories: ['מזון', 'וטרינר', 'תרופות', 'צעצועים', 'טיפוח', 'אחר'],
                icon: '🐕',
                color: '#e67e22',
                isDefault: true,
            },
            {
                name: 'ילדים',
                type: 'expense',
                subcategories: ['חיתולים', 'מזון תינוקות', 'צעצועים', 'ביגוד ילדים', 'חוגים', 'אחר'],
                icon: '👶',
                color: '#ff7675',
                isDefault: true,
            },
            {
                name: 'רכב ותחבורה',
                type: 'expense',
                subcategories: ['דלק', 'חניה', 'תחזוקה', 'ביטוח רכב', 'רישיון', 'אחר'],
                icon: '🚗',
                color: '#74b9ff',
                isDefault: true,
            },
        ];

        for (const household of households) {
            console.log(`Processing household: ${household.name}`);
            
            for (const categoryData of newCategories) {
                // Check if category already exists for this household
                const existingCategory = await Category.findOne({
                    household: household._id,
                    name: categoryData.name,
                    type: categoryData.type
                });

                if (!existingCategory) {
                    const category = new Category({
                        ...categoryData,
                        household: household._id,
                    });
                    await category.save();
                    console.log(`  ✅ Added: ${categoryData.name}`);
                } else {
                    console.log(`  ⏭️  Skipped: ${categoryData.name} (already exists)`);
                }
            }
            console.log('');
        }

        console.log('✨ New categories addition completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding new categories:', error);
        process.exit(1);
    }
};

addNewCategories();
