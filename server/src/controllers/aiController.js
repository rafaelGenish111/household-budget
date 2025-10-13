import { generateRecommendations } from '../utils/aiRecommendations.js';

// @desc    Get AI recommendations
// @route   GET /api/ai/recommendations
// @access  Private
export const getRecommendations = async (req, res) => {
    try {
        const { month } = req.query;
        const household = req.user.household;

        // Default to current month if not provided
        const currentMonth =
            month ||
            new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' }).slice(0, 7);

        const recommendations = await generateRecommendations(household, currentMonth);

        res.json({
            success: true,
            month: currentMonth,
            count: recommendations.length,
            recommendations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

