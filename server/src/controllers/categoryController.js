import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        const household = req.user.household;

        // Get both global (isDefault) and household-specific categories
        const query = {
            $or: [{ household: household }, { isDefault: true }],
        };

        if (type) {
            query.type = type;
        }

        const categories = await Category.find(query).sort({ name: 1 });

        // Remove duplicates by name (keep the first occurrence)
        const uniqueCategories = categories.reduce((acc, category) => {
            if (!acc.find(cat => cat.name === category.name)) {
                acc.push(category);
            }
            return acc;
        }, []);

        res.json({
            success: true,
            count: uniqueCategories.length,
            categories: uniqueCategories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
    try {
        const categoryData = {
            ...req.body,
            household: req.user.household,
            isDefault: false,
        };

        const category = await Category.create(categoryData);

        res.status(201).json({
            success: true,
            category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'קטגוריה לא נמצאה',
            });
        }

        // Cannot update default categories
        if (category.isDefault) {
            return res.status(403).json({
                success: false,
                message: 'לא ניתן לערוך קטגוריות ברירת מחדל',
            });
        }

        // Check if category belongs to user's household
        if (category.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לעדכן קטגוריה זו',
            });
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'קטגוריה לא נמצאה',
            });
        }

        // Cannot delete default categories
        if (category.isDefault) {
            return res.status(403).json({
                success: false,
                message: 'לא ניתן למחוק קטגוריות ברירת מחדל',
            });
        }

        // Check if category belongs to user's household
        if (category.household.toString() !== req.user.household.toString()) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה למחוק קטגוריה זו',
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'קטגוריה נמחקה בהצלחה',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

