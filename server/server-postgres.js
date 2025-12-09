const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
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
    generateToken,
    authenticate,
    authorize,
    optionalAuth
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));

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

// ==================== AUTH ENDPOINTS ====================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await userOperations.getByUsername(username);

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await userOperations.updateLastLogin(user.id);

        const token = generateToken(user);

        res.json({
            success: true,
            token,
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

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await userOperations.getById(req.user.id);
        const hashedCurrent = hashPassword(currentPassword);

        if (user.password !== hashedCurrent) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        await userOperations.update(req.user.id, {
            password: hashPassword(newPassword)
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
app.post('/api/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { username, password, role, fullName, email, phone } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role required' });
        }

        // Check if username exists
        const existing = await userOperations.getByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = await userOperations.create({
            id: `user-${Date.now()}`,
            username,
            password: hashPassword(password),
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
app.put('/api/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        if (req.body.fullName) updates.full_name = req.body.fullName;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.phone) updates.phone = req.body.phone;
        if (req.body.role) updates.role = req.body.role;
        if (req.body.active !== undefined) updates.active = req.body.active;
        if (req.body.password) updates.password = hashPassword(req.body.password);

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
            await userOperations.create({
                id: 'admin-001',
                username: 'admin',
                password: hashPassword('admin123'),
                role: 'admin',
                fullName: 'System Administrator',
                email: 'admin@example.com',
                phone: null,
                active: true
            });
            console.log('✅ Created default admin user (username: admin, password: admin123)');
        }

        app.listen(PORT, () => {
            console.log('\n🚀 Agriculture Data System (PostgreSQL) - Server Running');
            console.log(`📍 Server: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`📱 Mobile App: http://localhost:${PORT}`);
            console.log('\n📡 API Endpoints:');
            console.log('   Auth:');
            console.log('     POST   /api/auth/login');
            console.log('     GET    /api/auth/verify');
            console.log('     POST   /api/auth/change-password');
            console.log('   Data Collection:');
            console.log('     POST   /api/sync');
            console.log('     GET    /api/surveys');
            console.log('     GET    /api/surveys/nearby');
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
            console.log('\n⚠️  Default Credentials: admin / admin123 (CHANGE IN PRODUCTION!)');
            console.log('🔐 JWT Authentication enabled on protected endpoints\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
