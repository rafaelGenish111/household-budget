import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // ב-Serverless של Vercel, אסור לבצע process.exit()
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

