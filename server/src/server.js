import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureDefaultCategories } from './middleware/ensureDefaultCategories.js';
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
import multiImageReceiptRoutes from './routes/multiImageReceipt.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Lazy DB connection for Serverless: נתחבר על פי דרישה
let isConnecting = false;
async function ensureDbConnected() {
    if (mongoose.connection.readyState === 1) return; // already connected
    if (isConnecting) return;
    isConnecting = true;
    try {
        await connectDB();
        // וודא שקטגוריות ברירת מחדל קיימות
        await ensureDefaultCategories();
    } catch (e) {
        console.error('DB connect error (lazy):', e.message);
    } finally {
        isConnecting = false;
    }
}

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS middleware - פשוט וחזק
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://household-budget-client.vercel.app',
            'https://household-budget-client-git-main-rafaelgenish111s-projects.vercel.app',
            /^https:\/\/household-budget-client.*\.vercel\.app$/ // כל ה-subdomains של Vercel
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-auth-token',
            'Accept',
            'Origin',
            'X-Requested-With'
        ],
        optionsSuccessStatus: 200 // תמיכה ב-Internet Explorer
    })
);

// טיפול נוסף ב-preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
});

// Middleware נוסף לוודא שכל התגובות כוללות כותרות CORS
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://household-budget-client.vercel.app',
        'https://household-budget-client-git-main-rafaelgenish111s-projects.vercel.app'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/household-budget-client.*\.vercel\.app$/))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, Accept, Origin, X-Requested-With');
    
    next();
});

// Health first (ללא תלות ב-DB)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        db: {
            readyState: mongoose.connection.readyState, // 0=disconnected,1=connected,2=connecting,3=disconnecting
            hasUri: !!process.env.MONGO_URI
        }
    });
});

// Ensure DB for API routes (למעט health)
app.use(async (req, res, next) => {
    if (req.path === '/api/health') return next();
    await ensureDbConnected();
    return next();
});

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
app.use('/api/multi-receipt', multiImageReceiptRoutes);

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
            receipts: '/api/receipts',
            multiReceipt: '/api/multi-receipt'
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

// (moved health route above)

// Error handler (must be last)
app.use(errorHandler);

// ב-Vercel (Serverless) לא מאזינים לפורט, רק מייצאים את האפליקציה
// ל-Local/Production רגיל כן נפעיל listen
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || config.port;
    const server = app.listen(PORT, async () => {
        console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
        // וודא שקטגוריות ברירת מחדל קיימות בהתחלה
        try {
            await ensureDefaultCategories();
        } catch (error) {
            console.error('Error ensuring default categories on startup:', error);
        }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
        console.log(`Error: ${err.message}`);
        server.close(() => process.exit(1));
    });
}

// ייצוא כ-handler עבור Vercel Serverless
export default function handler(req, res) {
    return app(req, res);
}

