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

// Background export processing function
async function processExport(exportId) {
    const { pool } = require('./database');

    try {
        // Update status to processing
        await pool.query(
            'UPDATE export_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['processing', exportId]
        );

        // Simulate processing time (in real app, generate actual CSV/JSON and create ZIP)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Calculate file size (mock data, in real app would be actual file size)
        const fileSize = Math.floor(Math.random() * 5000000) + 100000; // 100KB - 5MB

        // Update status to completed
        await pool.query(`
            UPDATE export_jobs 
            SET status = $1, 
                file_size = $2,
                processing_time = $3,
                updated_at = CURRENT_TIMESTAMP,
                completed_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, ['completed', fileSize, 'a few seconds', exportId]);

        console.log(`Export ${exportId} completed successfully`);
    } catch (error) {
        console.error(`Export ${exportId} failed:`, error);

        // Update status to failed
        await pool.query(
            'UPDATE export_jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['failed', error.message, exportId]
        );
    }
}

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

// ==================== REPORTS ENDPOINTS ====================

// Get surveys and statuses report
app.get('/api/reports/surveys-statuses', authenticate, async (req, res) => {
    try {
        const { pool } = require('./database');

        // Get survey statistics grouped by form template or default
        const surveysResult = await pool.query(`
            SELECT 
                COALESCE(ft.id::text, 'default') as survey_id,
                COALESCE(ft.title, 'Default Farm Survey') as questionnaire_title,
                COUNT(CASE WHEN s.status = 'supervisor_assigned' THEN 1 END) as supervisor_assigned,
                COUNT(CASE WHEN s.status = 'interviewer_assigned' THEN 1 END) as interviewer_assigned,
                COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN s.status = 'rejected_supervisor' THEN 1 END) as rejected_supervisor,
                COUNT(CASE WHEN s.status = 'approved_supervisor' THEN 1 END) as approved_supervisor,
                COUNT(CASE WHEN s.status = 'rejected_hq' THEN 1 END) as rejected_hq,
                COUNT(CASE WHEN s.status = 'approved_hq' THEN 1 END) as approved_hq,
                COUNT(*) as total
            FROM surveys s
            LEFT JOIN form_templates ft ON s.form_template_id = ft.id
            GROUP BY ft.id, ft.title
            ORDER BY questionnaire_title
        `);

        // Get list of supervisors
        const supervisorsResult = await pool.query(`
            SELECT id, username, full_name
            FROM users
            WHERE role = 'supervisor'
            ORDER BY full_name, username
        `);

        // Get list of survey templates
        const templatesResult = await pool.query(`
            SELECT id, title
            FROM form_templates
            WHERE published = true
            ORDER BY title
        `);

        res.json({
            surveys: surveysResult.rows,
            supervisors: supervisorsResult.rows.map(s => ({
                id: s.id,
                name: s.full_name || s.username,
                username: s.username
            })),
            surveyTemplates: templatesResult.rows
        });
    } catch (error) {
        console.error('Error fetching surveys-statuses report:', error);
        res.status(500).json({ error: 'Failed to fetch report data' });
    }
});

// Export surveys and statuses report
app.get('/api/reports/surveys-statuses/export', authenticate, async (req, res) => {
    try {
        const { format, supervisor, survey } = req.query;
        const { pool } = require('./database');

        // Build query with filters
        let query = `
            SELECT 
                COALESCE(ft.title, 'Default Farm Survey') as questionnaire_title,
                COUNT(CASE WHEN s.status = 'supervisor_assigned' THEN 1 END) as supervisor_assigned,
                COUNT(CASE WHEN s.status = 'interviewer_assigned' THEN 1 END) as interviewer_assigned,
                COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN s.status = 'rejected_supervisor' THEN 1 END) as rejected_supervisor,
                COUNT(CASE WHEN s.status = 'approved_supervisor' THEN 1 END) as approved_supervisor,
                COUNT(CASE WHEN s.status = 'rejected_hq' THEN 1 END) as rejected_hq,
                COUNT(CASE WHEN s.status = 'approved_hq' THEN 1 END) as approved_hq,
                COUNT(*) as total
            FROM surveys s
            LEFT JOIN form_templates ft ON s.form_template_id = ft.id
            WHERE 1=1
        `;

        const params = [];
        if (supervisor) {
            params.push(supervisor);
            query += ` AND s.user_id IN (SELECT id FROM users WHERE role = 'enumerator' AND supervisor_id = $${params.length})`;
        }
        if (survey) {
            params.push(survey);
            query += ` AND s.form_template_id = $${params.length}`;
        }

        query += ' GROUP BY ft.title ORDER BY questionnaire_title';

        const result = await pool.query(query, params);

        // Generate export based on format
        if (format === 'csv' || format === 'tab') {
            const delimiter = format === 'csv' ? ',' : '\t';
            const headers = ['Questionnaire Title', 'Supervisor Assigned', 'Interviewer Assigned', 'Completed',
                'Rejected by Supervisor', 'Approved by Supervisor', 'Rejected by HQ', 'Approved by HQ', 'Total'];

            let content = headers.join(delimiter) + '\n';
            result.rows.forEach(row => {
                content += [
                    row.questionnaire_title,
                    row.supervisor_assigned,
                    row.interviewer_assigned,
                    row.completed,
                    row.rejected_supervisor,
                    row.approved_supervisor,
                    row.rejected_hq,
                    row.approved_hq,
                    row.total
                ].join(delimiter) + '\n';
            });

            res.setHeader('Content-Type', `text/${format === 'csv' ? 'csv' : 'tab-separated-values'}`);
            res.setHeader('Content-Disposition', `attachment; filename=surveys-statuses.${format === 'csv' ? 'csv' : 'txt'}`);
            res.send(content);
        } else if (format === 'xlsx') {
            // For now, return CSV format - will add XLSX library later
            res.status(501).json({ error: 'XLSX export not yet implemented. Please use CSV or TAB format.' });
        } else {
            res.status(400).json({ error: 'Invalid export format' });
        }
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
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

// ==================== INTERVIEWS ENDPOINTS ====================

// Get all interviews with details
app.get('/api/interviews', authenticate, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.userId;

        let query = `
            SELECT 
                s.id,
                CONCAT(EXTRACT(YEAR FROM s.created_at), '-', 
                       LPAD(EXTRACT(MONTH FROM s.created_at)::text, 2, '0'), '-',
                       LPAD(s.id::text, 6, '0')) as interview_key,
                COALESCE(s.farmer_name, 'Unknown') as identifying_questions,
                u.username as responsible,
                s.updated_at,
                0 as errors_count,
                CASE 
                    WHEN s.farmer_name IS NULL OR s.farmer_name = '' THEN 1
                    ELSE 0
                END as not_answered,
                'CAPI' as interview_mode,
                COALESCE(s.status, 'interviewer_assigned') as status,
                CASE 
                    WHEN s.synced = true THEN true
                    ELSE false
                END as received_by_tablet,
                COALESCE(s.assignment_id::text, '-') as assignment,
                COALESCE(ft.title, 'Farm Survey') as questionnaire_title,
                COALESCE(ft.version, '1') as version
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.username
            LEFT JOIN form_templates ft ON s.form_template_id = ft.id
        `;

        // Filter by role
        if (role === 'enumerator') {
            query += ` WHERE s.user_id = $1`;
        } else if (role === 'supervisor') {
            query += ` WHERE (s.user_id = $1 OR u.supervisor_id = $1)`;
        }
        // Admin sees all

        query += ` ORDER BY s.updated_at DESC`;

        const result = role === 'admin'
            ? await pool.query(query)
            : await pool.query(query, [userId]);

        res.json({
            interviews: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
});

// Export interviews
app.get('/api/interviews/export', authenticate, async (req, res) => {
    try {
        const { format, questionnaire, status, responsible, mode } = req.query;
        const role = req.user.role;
        const userId = req.user.userId;

        let query = `
            SELECT 
                CONCAT(EXTRACT(YEAR FROM s.created_at), '-', 
                       LPAD(EXTRACT(MONTH FROM s.created_at)::text, 2, '0'), '-',
                       LPAD(s.id::text, 6, '0')) as interview_key,
                COALESCE(s.farmer_name, 'Unknown') as identifying_questions,
                u.username as responsible,
                s.updated_at,
                0 as errors_count,
                CASE 
                    WHEN s.farmer_name IS NULL OR s.farmer_name = '' THEN 1
                    ELSE 0
                END as not_answered,
                'CAPI' as interview_mode,
                COALESCE(s.status, 'interviewer_assigned') as status,
                CASE 
                    WHEN s.synced = true THEN 'Yes'
                    ELSE 'No'
                END as received_by_tablet,
                COALESCE(s.assignment_id::text, '-') as assignment,
                COALESCE(ft.title, 'Farm Survey') as questionnaire_title
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.username
            LEFT JOIN form_templates ft ON s.form_template_id = ft.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Filter by role
        if (role === 'enumerator') {
            query += ` AND s.user_id = $${paramIndex++}`;
            params.push(userId);
        } else if (role === 'supervisor') {
            query += ` AND (s.user_id = $${paramIndex} OR u.supervisor_id = $${paramIndex})`;
            params.push(userId);
            paramIndex++;
        }

        // Apply filters
        if (questionnaire) {
            query += ` AND ft.title = $${paramIndex++}`;
            params.push(questionnaire);
        }
        if (status) {
            query += ` AND s.status = $${paramIndex++}`;
            params.push(status);
        }
        if (responsible) {
            query += ` AND u.username = $${paramIndex++}`;
            params.push(responsible);
        }

        query += ` ORDER BY s.updated_at DESC`;

        const result = await pool.query(query, params);

        // Generate CSV
        const delimiter = format === 'tab' ? '\t' : ',';
        const headers = [
            'Interview Key', 'Identifying Questions', 'Responsible',
            'Updated On', 'Errors Count', 'Not Answered',
            'Interview Mode', 'Status', 'Received by Tablet',
            'Assignment', 'Questionnaire'
        ].join(delimiter);

        const rows = result.rows.map(row => {
            return [
                row.interview_key,
                `"${row.identifying_questions}"`,
                row.responsible,
                row.updated_at,
                row.errors_count,
                row.not_answered,
                row.interview_mode,
                row.status,
                row.received_by_tablet,
                row.assignment,
                `"${row.questionnaire_title}"`
            ].join(delimiter);
        });

        const csv = [headers, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="interviews_${new Date().toISOString().split('T')[0]}.${format === 'tab' ? 'txt' : 'csv'}"`);
        res.send(csv);

    } catch (error) {
        console.error('Export interviews error:', error);
        res.status(500).json({ error: 'Failed to export interviews' });
    }
});

// ==================== USER MANAGEMENT ====================

// Get current user profile
app.get('/api/users/profile', authenticate, async (req, res) => {
    try {
        const user = await userOperations.getByUsername(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update current user profile
app.put('/api/users/profile', authenticate, async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        const userId = req.user.userId;

        const updates = {};
        if (fullName) updates.full_name = fullName;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;

        const updated = await userOperations.update(userId, updates);

        res.json({
            success: true,
            user: {
                id: updated.id,
                username: updated.username,
                full_name: updated.full_name,
                email: updated.email,
                phone: updated.phone
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

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

// Export surveys CSV
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

// Export surveys JSON
app.get('/api/export/json', authenticate, async (req, res) => {
    try {
        const surveys = await surveyOperations.exportToCSV();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="surveys_${Date.now()}.json"`);
        res.json(surveys);
    } catch (error) {
        console.error('Export JSON error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Export users
app.get('/api/export/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const users = await userOperations.getAll();

        const csvRows = [['ID', 'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Active', 'Created At']];

        users.forEach(u => {
            csvRows.push([
                u.id, u.username, u.full_name || '', u.email || '', u.phone || '',
                u.role, u.active ? 'Yes' : 'No', u.created_at
            ]);
        });

        const csv = csvRows.map(row =>
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export users error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Export forms
app.get('/api/export/forms', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM form_templates ORDER BY created_at DESC');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="forms_${Date.now()}.json"`);
        res.json(result.rows);
    } catch (error) {
        console.error('Export forms error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Export GeoJSON
app.get('/api/export/geojson', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, farmer_name, village, island, latitude, longitude, 
                   farm_size, crops, created_at
            FROM surveys 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);

        const features = result.rows.map(row => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
            },
            properties: {
                id: row.id,
                farmer_name: row.farmer_name,
                village: row.village,
                island: row.island,
                farm_size: row.farm_size,
                crops: row.crops,
                created_at: row.created_at
            }
        }));

        const geojson = {
            type: 'FeatureCollection',
            features: features
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="surveys_locations_${Date.now()}.geojson"`);
        res.json(geojson);
    } catch (error) {
        console.error('Export GeoJSON error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Generate data export
app.post('/api/export/generate', authenticate, async (req, res) => {
    try {
        const { questionnaireId, version, status, dateRange } = req.body;
        const userId = req.user.userId;

        // Get questionnaire title
        const formResult = await pool.query('SELECT title FROM form_templates WHERE id = $1', [questionnaireId]);
        const questionnaireTitle = formResult.rows[0]?.title || 'Unknown Survey';

        // Create export job
        const result = await pool.query(`
            INSERT INTO export_jobs (
                questionnaire_id, questionnaire_title, version, 
                status_filter, date_range, created_by, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'queued')
            RETURNING *
        `, [questionnaireId, questionnaireTitle, version, status, dateRange, userId]);

        const exportJob = result.rows[0];

        // Start processing in background (in real app, use job queue like Bull or RabbitMQ)
        processExport(exportJob.id);

        res.json({
            success: true,
            exportId: exportJob.id,
            message: 'Export job created successfully'
        });
    } catch (error) {
        console.error('Generate export error:', error);
        res.status(500).json({ error: 'Failed to generate export' });
    }
});

// Get export history
app.get('/api/export/history', authenticate, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.userId;

        let query = `
            SELECT * FROM export_jobs
        `;

        // Filter by user for non-admins
        if (role !== 'admin') {
            query += ` WHERE created_by = $1`;
        }

        query += ` ORDER BY created_at DESC LIMIT 50`;

        const result = role === 'admin'
            ? await pool.query(query)
            : await pool.query(query, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Get export history error:', error);
        res.status(500).json({ error: 'Failed to fetch export history' });
    }
});

// Download export file
app.get('/api/export/download/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        // Get export job
        const result = await pool.query('SELECT * FROM export_jobs WHERE id = $1', [id]);
        const exportJob = result.rows[0];

        if (!exportJob) {
            return res.status(404).json({ error: 'Export not found' });
        }

        // Check permissions
        if (role !== 'admin' && exportJob.created_by !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (exportJob.status !== 'completed') {
            return res.status(400).json({ error: 'Export is not ready yet' });
        }

        // In a real system, you would read the actual file from disk
        // For now, generate CSV data on the fly
        const { questionnaireId, statusFilter } = exportJob;

        let query = `
            SELECT s.*, u.username as enumerator, ft.title as questionnaire
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.username
            LEFT JOIN form_templates ft ON s.form_template_id = ft.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (questionnaireId) {
            query += ` AND s.form_template_id = $${paramIndex++}`;
            params.push(questionnaireId);
        }

        if (statusFilter) {
            query += ` AND s.status = $${paramIndex++}`;
            params.push(statusFilter);
        }

        const surveyResult = await pool.query(query, params);

        // Generate CSV
        const csvRows = [
            ['ID', 'Interview Key', 'Farmer Name', 'Household Size', 'Phone', 'Village', 'Island',
                'Latitude', 'Longitude', 'GPS Accuracy', 'Farm Size', 'Crops',
                'Pest Issues', 'Status', 'Created At', 'Enumerator', 'Questionnaire']
        ];

        surveyResult.rows.forEach((s, index) => {
            const interviewKey = `${new Date(s.created_at).getFullYear()}-${String(new Date(s.created_at).getMonth() + 1).padStart(2, '0')}-${String(s.id).padStart(6, '0')}`;
            const crops = typeof s.crops === 'string' ? s.crops : JSON.stringify(s.crops);

            csvRows.push([
                s.id,
                interviewKey,
                s.farmer_name || '',
                s.household_size || '',
                s.phone || '',
                s.village || '',
                s.island || '',
                s.latitude || '',
                s.longitude || '',
                s.gps_accuracy || '',
                s.farm_size || '',
                crops,
                s.pest_issues ? 'Yes' : 'No',
                s.status || 'interviewer_assigned',
                s.created_at,
                s.enumerator || '',
                s.questionnaire || ''
            ]);
        });

        const csv = csvRows.map(row =>
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export_${id}_${exportJob.questionnaire_title.replace(/\s+/g, '_')}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Download export error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// ==================== WORKSPACES ENDPOINTS ====================

// Get all workspaces
app.get('/api/workspaces', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT name, display_name, created_at, updated_at
            FROM workspaces
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Get workspaces error:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

// Get single workspace
app.get('/api/workspaces/:name', authenticate, async (req, res) => {
    try {
        const { name } = req.params;

        const result = await pool.query(
            'SELECT name, display_name, created_at, updated_at FROM workspaces WHERE name = $1',
            [name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get workspace error:', error);
        res.status(500).json({ error: 'Failed to fetch workspace' });
    }
});

// Create new workspace
app.post('/api/workspaces', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name, display_name } = req.body;

        // Validate name format
        if (!/^[a-z0-9_-]{3,50}$/.test(name)) {
            return res.status(400).json({
                error: 'Invalid workspace name. Must be 3-50 characters, lowercase letters, numbers, underscores, or hyphens only'
            });
        }

        // Validate display name
        if (!display_name || display_name.trim().length === 0 || display_name.length > 200) {
            return res.status(400).json({
                error: 'Display name is required and must be 200 characters or less'
            });
        }

        // Check if workspace already exists
        const existing = await pool.query('SELECT name FROM workspaces WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'A workspace with this name already exists' });
        }

        // Create workspace
        const result = await pool.query(`
            INSERT INTO workspaces (name, display_name)
            VALUES ($1, $2)
            RETURNING *
        `, [name, display_name.trim()]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
});

// Update workspace
app.put('/api/workspaces/:name', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name } = req.params;
        const { display_name } = req.body;

        // Validate display name
        if (!display_name || display_name.trim().length === 0 || display_name.length > 200) {
            return res.status(400).json({
                error: 'Display name is required and must be 200 characters or less'
            });
        }

        // Update workspace
        const result = await pool.query(`
            UPDATE workspaces
            SET display_name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE name = $2
            RETURNING *
        `, [display_name.trim(), name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update workspace error:', error);
        res.status(500).json({ error: 'Failed to update workspace' });
    }
});

// Delete workspace
app.delete('/api/workspaces/:name', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name } = req.params;

        // Prevent deleting primary workspace
        if (name === 'primary') {
            return res.status(400).json({ error: 'Cannot delete the primary workspace' });
        }

        // Check if workspace exists
        const existing = await pool.query('SELECT name FROM workspaces WHERE name = $1', [name]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // Check if workspace has questionnaires
        const questionnaires = await pool.query(
            'SELECT COUNT(*) FROM form_templates WHERE workspace_name = $1',
            [name]
        );

        if (parseInt(questionnaires.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete workspace with existing questionnaires. Please delete all questionnaires first.'
            });
        }

        // Check if workspace has surveys
        const surveys = await pool.query(
            'SELECT COUNT(*) FROM surveys WHERE workspace_name = $1',
            [name]
        );

        if (parseInt(surveys.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete workspace with existing surveys. Please delete all surveys first.'
            });
        }

        // Delete workspace
        await pool.query('DELETE FROM workspaces WHERE name = $1', [name]);

        res.json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
        console.error('Delete workspace error:', error);
        res.status(500).json({ error: 'Failed to delete workspace' });
    }
});

// ==================== SETTINGS ENDPOINTS ====================

// Get all settings
app.get('/api/settings', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        const settings = result.rows[0] || {
            global_note: { message: '', enabled: false },
            web_interview: { enabled: false, sessionTimeout: 30, allowAnonymous: false, requireEmail: false }
        };

        res.json({
            globalNote: settings.global_note,
            webInterview: settings.web_interview
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Save global note
app.post('/api/settings/global-note', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { message, enabled } = req.body;

        await pool.query(`
            INSERT INTO settings (id, global_note, updated_at)
            VALUES (1, $1, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET global_note = $1, updated_at = NOW()
        `, [JSON.stringify({ message, enabled })]);

        res.json({ success: true });
    } catch (error) {
        console.error('Save global note error:', error);
        res.status(500).json({ error: 'Failed to save global note' });
    }
});

// Save web interview settings
app.post('/api/settings/web-interview', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { enabled, sessionTimeout, allowAnonymous, requireEmail } = req.body;

        const webInterview = {
            enabled,
            url: process.env.BASE_URL + '/web-interview',
            sessionTimeout,
            allowAnonymous,
            requireEmail
        };

        await pool.query(`
            INSERT INTO settings (id, web_interview, updated_at)
            VALUES (1, $1, NOW())
            ON CONFLICT (id)
            DO UPDATE SET web_interview = $1, updated_at = NOW()
        `, [JSON.stringify(webInterview)]);

        res.json({ success: true });
    } catch (error) {
        console.error('Save web interview settings error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Upload company logo
app.post('/api/settings/company-logo', authenticate, authorize('admin'), async (req, res) => {
    try {
        // TODO: Implement file upload with multer
        res.json({ success: true, message: 'Logo upload endpoint ready for implementation' });
    } catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

// Remove company logo
app.delete('/api/settings/company-logo', authenticate, authorize('admin'), async (req, res) => {
    try {
        // TODO: Implement logo removal
        res.json({ success: true, message: 'Logo removed' });
    } catch (error) {
        console.error('Remove logo error:', error);
        res.status(500).json({ error: 'Failed to remove logo' });
    }
});

// Get devices
app.get('/api/devices', authenticate, async (req, res) => {
    try {
        // TODO: Implement device tracking
        res.json([
            {
                icon: '🖥️',
                name: 'Web Browser - Desktop',
                lastSeen: 'Today at ' + new Date().toLocaleTimeString(),
                deviceId: 'WEB-' + req.user.userId,
                online: true
            }
        ]);
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
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
            console.log('   Reports:');
            console.log('     GET    /api/reports/surveys-statuses');
            console.log('     GET    /api/reports/surveys-statuses/export');
            console.log('   Interviews:');
            console.log('     GET    /api/interviews');
            console.log('     GET    /api/interviews/export');
            console.log('   Dashboard:');
            console.log('     GET    /api/dashboard');
            console.log('   User Management:');
            console.log('     GET    /api/users');
            console.log('     GET    /api/users/profile');
            console.log('     PUT    /api/users/profile');
            console.log('     POST   /api/users');
            console.log('     PUT    /api/users/:id');
            console.log('     DELETE /api/users/:id');
            console.log('   Workspaces:');
            console.log('     GET    /api/workspaces');
            console.log('     GET    /api/workspaces/:name');
            console.log('     POST   /api/workspaces');
            console.log('     PUT    /api/workspaces/:name');
            console.log('     DELETE /api/workspaces/:name');
            console.log('   Settings:');
            console.log('     GET    /api/settings');
            console.log('     POST   /api/settings/global-note');
            console.log('     POST   /api/settings/web-interview');
            console.log('     POST   /api/settings/company-logo');
            console.log('     DELETE /api/settings/company-logo');
            console.log('     GET    /api/devices');
            console.log('   Export & Logs:');
            console.log('     GET    /api/export/csv');
            console.log('     GET    /api/export/json');
            console.log('     GET    /api/export/users');
            console.log('     GET    /api/export/forms');
            console.log('     GET    /api/export/geojson');
            console.log('     POST   /api/export/generate');
            console.log('     GET    /api/export/history');
            console.log('     GET    /api/export/download/:id');
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
