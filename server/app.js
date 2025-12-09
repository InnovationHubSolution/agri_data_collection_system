require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const {
    initializeDatabase,
    userOperations
} = require('./database');
const { hashPassword } = require('./auth');
const { sanitizeBody } = require('./validation');

// Import route modules
const authRoutes = require('./routes/auth.routes');
const surveyRoutes = require('./routes/survey.routes');
const userRoutes = require('./routes/user.routes');
const formRoutes = require('./routes/form.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with sanitization
app.use(bodyParser.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(sanitizeBody);

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));
app.use('/designer', express.static(path.join(__dirname, '../designer')));

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const { pool } = require('./database');
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api', surveyRoutes);  // Includes /sync, /surveys, /statistics
app.use('/api/users', userRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);

// Farmers endpoint (alias for surveys with pagination)
app.get('/api/farmers', async (req, res) => {
    try {
        const { surveyOperations } = require('./database');
        const filters = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            search: req.query.search
        };
        const result = await surveyOperations.getAll(filters);
        res.json({
            farmers: result.surveys,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch farmers' });
    }
});

// Sync logs endpoint
app.get('/api/sync-logs', async (req, res) => {
    try {
        const { syncLogOperations } = require('./database');
        const limit = parseInt(req.query.limit) || 100;
        const logs = await syncLogOperations.getRecent(limit);
        res.json(logs);
    } catch (error) {
        console.error('Get sync logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ==================== INITIALIZE & START ====================

async function startServer() {
    try {
        console.log('🚀 Starting Agriculture Data System Server...');

        // Initialize database
        console.log('📦 Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');

        // Create default admin if none exists
        const users = await userOperations.getAll();
        if (users.length === 0) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
            const hashedPassword = await hashPassword(defaultPassword);

            await userOperations.create({
                id: 'admin-001',
                username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
                password: hashedPassword,
                role: 'admin',
                fullName: 'System Administrator',
                email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
                phone: null,
                active: true
            });
            console.log('👤 Created default admin user');
            console.log(`   Username: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'}`);
            console.log(`   Password: ${defaultPassword}`);
            console.log('⚠️  WARNING: CHANGE DEFAULT PASSWORD IMMEDIATELY!');
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(70));
            console.log('🌾  AGRICULTURE DATA SYSTEM - SERVER RUNNING');
            console.log('='.repeat(70));
            console.log(`\n📡 Server URL: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`✏️  Designer: http://localhost:${PORT}/designer`);
            console.log(`📱 Mobile App: http://localhost:${PORT}`);
            console.log(`\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);
            console.log('\n📋 API ENDPOINTS:');
            console.log('   Authentication:');
            console.log('     POST   /api/auth/login');
            console.log('     POST   /api/auth/refresh');
            console.log('     GET    /api/auth/verify');
            console.log('     POST   /api/auth/change-password');
            console.log('\n   Data Collection:');
            console.log('     POST   /api/sync');
            console.log('     GET    /api/surveys');
            console.log('     GET    /api/surveys/nearby');
            console.log('     GET    /api/statistics');
            console.log('     GET    /api/farmers');
            console.log('\n   Form Designer:');
            console.log('     GET    /api/forms');
            console.log('     POST   /api/forms');
            console.log('     GET    /api/forms/:id');
            console.log('     PUT    /api/forms/:id');
            console.log('     DELETE /api/forms/:id');
            console.log('     POST   /api/forms/:id/publish');
            console.log('     GET    /api/forms/published/list');
            console.log('\n   Dashboard & Reports:');
            console.log('     GET    /api/dashboard');
            console.log('     GET    /api/sync-logs');
            console.log('\n   User Management:');
            console.log('     GET    /api/users');
            console.log('     POST   /api/users');
            console.log('     GET    /api/users/profile');
            console.log('     PUT    /api/users/profile');
            console.log('     PUT    /api/users/:id');
            console.log('     DELETE /api/users/:id');
            console.log('\n   Settings:');
            console.log('     GET    /api/settings');
            console.log('     POST   /api/settings/global-note');
            console.log('     POST   /api/settings/web-interview');
            console.log('\n   Export:');
            console.log('     GET    /api/export/csv');
            console.log('     GET    /api/export/json');
            console.log('     GET    /api/export/geojson');
            console.log('     GET    /api/export/users');
            console.log('     GET    /api/export/forms');
            console.log('\n   System:');
            console.log('     GET    /api/health');
            console.log('\n🔒 SECURITY FEATURES:');
            console.log('   ✓ bcrypt password hashing (cost factor: 12)');
            console.log('   ✓ JWT access + refresh tokens');
            console.log('   ✓ Input validation & sanitization');
            console.log('   ✓ Helmet security headers');
            console.log('   ✓ CORS protection');
            console.log('   ✓ SQL injection prevention (parameterized queries)');
            console.log('   ✓ PostGIS spatial indexing');
            console.log('\n' + '='.repeat(70) + '\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM signal received: closing HTTP server');
    const { pool } = require('./database');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT signal received: closing HTTP server');
    const { pool } = require('./database');
    await pool.end();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
