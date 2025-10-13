import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/config.js';

// Import routes
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import savingRoutes from './routes/savings.js';
import commitmentRoutes from './routes/commitments.js';
import goalRoutes from './routes/goals.js';
import categoryRoutes from './routes/categories.js';
import householdRoutes from './routes/household.js';
import aiRoutes from './routes/ai.js';
import receiptRoutes from './routes/receipts.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS middleware
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative dev port
    'https://household-budget-client.vercel.app', // Production client
    'https://household-budget-client-git-main-rafaelgenish111s-projects.vercel.app' // Vercel preview
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('🚫 CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
    })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/savings', savingRoutes);
app.use('/api/commitments', commitmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/receipts', receiptRoutes);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Household Budget Server is running! 🏠💰',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            transactions: '/api/transactions',
            savings: '/api/savings',
            commitments: '/api/commitments',
            goals: '/api/goals',
            categories: '/api/categories',
            household: '/api/household',
            ai: '/api/ai',
            receipts: '/api/receipts'
        },
        timestamp: new Date().toISOString(),
    });
});

// Favicon route (to prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
});

app.get('/favicon.png', (req, res) => {
    res.status(204).end(); // No content
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || config.port;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});

export default app;

