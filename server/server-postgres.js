require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const {
    initializeDatabase,
    surveyOperations,
    userOperations,
    syncLogOperations,
    photoOperations
} = require('./database');
const {
    hashPassword,
    comparePassword,
    generateTokenPair,
    refreshAccessToken,
    authenticate,
    authorize,
    optionalAuth
} = require('./auth');
const {
    validate,
    userValidation,
    surveyValidation,
    paginationValidation,
    sanitizeBody
} = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;

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
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
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

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));
app.use('/designer', express.static(path.join(__dirname, '../designer')));

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const { pool } = require('./database');
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

// ==================== FORM DESIGNER ENDPOINTS ====================

// Get all form templates
app.get('/api/forms', authenticate, async (req, res) => {
    try {
        const { pool } = require('./database');
        const result = await pool.query(`
            SELECT id, title, description, created_by, created_at, updated_at,
                   (SELECT COUNT(*) FROM jsonb_array_elements(questions)) as question_count
            FROM form_templates
            ORDER BY updated_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ error: 'Failed to fetch forms' });
    }
});

// Get single form template
app.get('/api/forms/:id', authenticate, async (req, res) => {
    try {
        const { pool } = require('./database');
        const result = await pool.query(
            'SELECT * FROM form_templates WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ error: 'Failed to fetch form' });
    }
});

// Create new form template
app.post('/api/forms', authenticate, async (req, res) => {
    try {
        const { title, description, questions } = req.body;
        
        if (!title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Title and questions array are required' });
        }
        
        const { pool } = require('./database');
        const result = await pool.query(`
            INSERT INTO form_templates (title, description, questions, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *
        `, [title, description || '', JSON.stringify(questions), req.user.id]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ error: 'Failed to create form' });
    }
});

// Update form template
app.put('/api/forms/:id', authenticate, async (req, res) => {
    try {
        const { title, description, questions } = req.body;
        const { pool } = require('./database');
        
        const result = await pool.query(`
            UPDATE form_templates
            SET title = $1, description = $2, questions = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [title, description || '', JSON.stringify(questions), req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ error: 'Failed to update form' });
    }
});

// Delete form template
app.delete('/api/forms/:id', authenticate, authorize(['admin', 'supervisor']), async (req, res) => {
    try {
        const { pool } = require('./database');
        const result = await pool.query(
            'DELETE FROM form_templates WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ error: 'Failed to delete form' });
    }
});

// Publish form (make it available for mobile app)
app.post('/api/forms/:id/publish', authenticate, authorize(['admin', 'supervisor']), async (req, res) => {
    try {
        const { pool } = require('./database');
        const result = await pool.query(`
            UPDATE form_templates
            SET published = true, published_at = NOW(), published_by = $1
            WHERE id = $2
            RETURNING *
        `, [req.user.id, req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error publishing form:', error);
        res.status(500).json({ error: 'Failed to publish form' });
    }
});

// Get published forms (for mobile app)
app.get('/api/forms/published/list', optionalAuth, async (req, res) => {
    try {
        const { pool } = require('./database');
        const result = await pool.query(`
            SELECT id, title, description, questions, published_at
            FROM form_templates
            WHERE published = true
            ORDER BY published_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching published forms:', error);
        res.status(500).json({ error: 'Failed to fetch published forms' });
    }
});

// ==================== AUTH ENDPOINTS ====================

// Login
app.post('/api/auth/login', userValidation.login, validate, async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await userOperations.getByUsername(username);

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Use bcrypt to compare passwords
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await userOperations.updateLastLogin(user.id);

        // Generate access and refresh tokens
        const tokens = generateTokenPair(user);

        res.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const newAccessToken = refreshAccessToken(refreshToken);

        if (!newAccessToken) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        res.json({
            success: true,
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Verify token
app.get('/api/auth/verify', authenticate, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Change password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const user = await userOperations.getById(req.user.id);
        
        // Use bcrypt to compare current password
        const isValid = await comparePassword(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        // Hash new password with bcrypt
        const hashedPassword = await hashPassword(newPassword);
        await userOperations.update(req.user.id, {
            password: hashedPassword
        });

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ==================== SYNC ENDPOINTS ====================

// Sync surveys (allows optional auth for backward compatibility)
app.post('/api/sync', optionalAuth, async (req, res) => {
    try {
        const surveys = req.body;
        const userId = req.user?.id || 'anonymous';
        const deviceId = req.headers['x-device-id'] || 'unknown';
        const ipAddress = req.ip || req.connection.remoteAddress;

        if (!Array.isArray(surveys)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        let syncedCount = 0;
        let conflictCount = 0;
        const conflicts = [];

        for (const survey of surveys) {
            try {
                const result = await surveyOperations.upsert({
                    ...survey,
                    userId: survey.userId || userId
                });

                // Save photos if present
                if (survey.photos && survey.photos.length > 0) {
                    await photoOperations.create(result.survey.id, survey.photos);
                }

                if (!result.isNew) {
                    conflictCount++;
                    conflicts.push({
                        clientId: survey.clientId,
                        farmerName: survey.farmerName,
                        resolution: 'updated'
                    });
                }

                syncedCount++;
            } catch (error) {
                console.error('Survey sync error:', error);
            }
        }

        // Log sync event
        await syncLogOperations.create({
            eventType: 'sync',
            userId,
            deviceId,
            surveyCount: syncedCount,
            success: true,
            ipAddress
        });

        res.json({
            success: true,
            syncedCount,
            conflictCount,
            conflicts,
            message: `Successfully synced ${syncedCount} surveys`
        });

    } catch (error) {
        console.error('Sync error:', error);

        // Log failed sync
        try {
            await syncLogOperations.create({
                eventType: 'sync',
                userId: req.user?.id || 'anonymous',
                deviceId: req.headers['x-device-id'] || 'unknown',
                surveyCount: 0,
                success: false,
                errorMessage: error.message,
                ipAddress: req.ip
            });
        } catch (logError) {
            console.error('Failed to log sync error:', logError);
        }

        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

// ==================== SURVEY ENDPOINTS ====================

// Get all surveys (with filters)
app.get('/api/surveys', authenticate, async (req, res) => {
    try {
        const filters = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            search: req.query.search,
            island: req.query.island,
            village: req.query.village,
            userId: req.query.userId,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const result = await surveyOperations.getAll(filters);
        res.json(result);

    } catch (error) {
        console.error('Get surveys error:', error);
        res.status(500).json({ error: 'Failed to fetch surveys' });
    }
});

// Find nearby farms
app.get('/api/surveys/nearby', authenticate, async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }

        const radiusKm = parseFloat(radius) || 10;
        const nearby = await surveyOperations.findNearby(
            parseFloat(latitude),
            parseFloat(longitude),
            radiusKm
        );

        res.json({ farms: nearby, radius: radiusKm });

    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// ==================== DASHBOARD ENDPOINTS ====================

app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const stats = await surveyOperations.getStatistics();

        // Get user count
        const users = await userOperations.getAll();
        stats.summary.total_users = users.length;

        res.json(stats);

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// ==================== USER MANAGEMENT ====================

// Get all users (admin/supervisor only)
app.get('/api/users', authenticate, authorize('admin', 'supervisor'), async (req, res) => {
    try {
        const users = await userOperations.getAll();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user (admin only)
app.post('/api/users', authenticate, authorize('admin'), userValidation.create, validate, async (req, res) => {
    try {
        const { username, password, role, fullName, email, phone } = req.body;

        // Check if username exists
        const existing = await userOperations.getByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password with bcrypt
        const hashedPassword = await hashPassword(password);

        const newUser = await userOperations.create({
            id: `user-${Date.now()}`,
            username,
            password: hashedPassword,
            role,
            fullName,
            email,
            phone,
            active: true
        });

        res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                fullName: newUser.full_name
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user (admin only)
app.put('/api/users/:id', authenticate, authorize('admin'), userValidation.update, validate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        if (req.body.fullName) updates.full_name = req.body.fullName;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.phone) updates.phone = req.body.phone;
        if (req.body.role) updates.role = req.body.role;
        if (req.body.active !== undefined) updates.active = req.body.active;
        
        // Hash password with bcrypt if being updated
        if (req.body.password) {
            updates.password = await hashPassword(req.body.password);
        }

        const updated = await userOperations.update(id, updates);

        res.json({
            success: true,
            user: {
                id: updated.id,
                username: updated.username,
                role: updated.role,
                fullName: updated.full_name
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await userOperations.delete(id);
        res.json({ success: true, message: 'User deleted' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ==================== EXPORT ENDPOINTS ====================

app.get('/api/export/csv', authenticate, async (req, res) => {
    try {
        const surveys = await surveyOperations.exportToCSV();

        const csvRows = [
            ['ID', 'Farmer Name', 'Household Size', 'Phone', 'Village', 'Island',
                'Latitude', 'Longitude', 'GPS Accuracy', 'Farm Size (ha)',
                'Crops', 'Cattle', 'Pigs', 'Chickens', 'Goats',
                'Pest Issues', 'Pest Severity', 'Pest Description', 'Treatment Used',
                'Harvest Date', 'Notes', 'Created At', 'Synced At', 'Enumerator', 'Device ID']
        ];

        surveys.forEach(s => {
            const livestock = typeof s.livestock === 'string' ? JSON.parse(s.livestock) : s.livestock;
            const crops = typeof s.crops === 'string' ? JSON.parse(s.crops) : s.crops;

            csvRows.push([
                s.id, s.farmer_name, s.household_size, s.phone, s.village, s.island,
                s.latitude, s.longitude, s.gps_accuracy, s.farm_size,
                Array.isArray(crops) ? crops.join('; ') : '',
                livestock?.cattle || 0, livestock?.pigs || 0, livestock?.chickens || 0, livestock?.goats || 0,
                s.pest_issues, s.pest_severity, s.pest_description, s.treatment_used,
                s.harvest_date, s.notes, s.created_at, s.synced_at, s.enumerator, s.device_id
            ]);
        });

        const csv = csvRows.map(row =>
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="surveys_${Date.now()}.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// ==================== SYNC LOGS ====================

app.get('/api/sync-logs', authenticate, authorize('admin', 'supervisor'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await syncLogOperations.getRecent(limit);
        res.json(logs);
    } catch (error) {
        console.error('Get sync logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ==================== INITIALIZE & START ====================

async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();

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
            console.log('Created default admin user (username: ' + (process.env.DEFAULT_ADMIN_USERNAME || 'admin') + ', password: ' + defaultPassword + ')');
            console.log('WARNING: CHANGE DEFAULT PASSWORD IMMEDIATELY!');
        }

        app.listen(PORT, () => {
            console.log('\nAgriculture Data System (PostgreSQL) - Server Running');
            console.log('Server: http://localhost:' + PORT);
            console.log('Dashboard: http://localhost:' + PORT + '/dashboard');
            console.log('Designer: http://localhost:' + PORT + '/designer');
            console.log('Mobile App: http://localhost:' + PORT);
            console.log('\nAPI Endpoints:');
            console.log('   Auth:');
            console.log('     POST   /api/auth/login');
            console.log('     GET    /api/auth/verify');
            console.log('     POST   /api/auth/change-password');
            console.log('   Data Collection:');
            console.log('     POST   /api/sync');
            console.log('     GET    /api/surveys');
            console.log('     GET    /api/surveys/nearby');
            console.log('   Form Designer:');
            console.log('     GET    /api/forms');
            console.log('     POST   /api/forms');
            console.log('     GET    /api/forms/:id');
            console.log('     PUT    /api/forms/:id');
            console.log('     DELETE /api/forms/:id');
            console.log('     POST   /api/forms/:id/publish');
            console.log('     GET    /api/forms/published/list');
            console.log('   Dashboard:');
            console.log('     GET    /api/dashboard');
            console.log('   User Management:');
            console.log('     GET    /api/users');
            console.log('     POST   /api/users');
            console.log('     PUT    /api/users/:id');
            console.log('     DELETE /api/users/:id');
            console.log('   Export & Logs:');
            console.log('     GET    /api/export/csv');
            console.log('     GET    /api/sync-logs');
            console.log('   System:');
            console.log('     GET    /api/health');
            console.log('\nSecurity Features Enabled:');
            console.log('   - bcrypt password hashing (cost factor: 12)');
            console.log('   - JWT access + refresh tokens');
            console.log('   - Input validation & sanitization');
            console.log('   - Helmet security headers');
            console.log('   - CORS protection');
            console.log('   - HTTPS redirect (production only)');
            console.log('\nDefault Credentials: admin / Admin@123456 (CHANGE IMMEDIATELY!)');
            console.log('Configure .env file for production settings\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
