const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve dashboard static files
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));

// Data storage directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const surveysFile = path.join(dataDir, 'surveys.json');
const usersFile = path.join(dataDir, 'users.json');
const syncLogFile = path.join(dataDir, 'sync_log.json');
const backupDir = path.join(dataDir, 'backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Initialize data files if they don't exist
if (!fs.existsSync(surveysFile)) {
    fs.writeFileSync(surveysFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(usersFile)) {
    // Create default admin user
    const defaultUsers = [
        {
            id: 'admin-001',
            username: 'admin',
            password: hashPassword('admin123'), // Change in production!
            role: 'admin',
            fullName: 'System Administrator',
            email: 'admin@example.com',
            createdAt: new Date().toISOString(),
            active: true
        }
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
}

if (!fs.existsSync(syncLogFile)) {
    fs.writeFileSync(syncLogFile, JSON.stringify([], null, 2));
}

// Simple password hashing (use bcrypt in production)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Read/Write functions
function readSurveys() {
    try {
        const data = fs.readFileSync(surveysFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading surveys:', error);
        return [];
    }
}

function writeSurveys(surveys) {
    try {
        fs.writeFileSync(surveysFile, JSON.stringify(surveys, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing surveys:', error);
        return false;
    }
}

function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

function readSyncLog() {
    try {
        const data = fs.readFileSync(syncLogFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeSyncLog(logs) {
    try {
        fs.writeFileSync(syncLogFile, JSON.stringify(logs, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

function logSyncEvent(event) {
    const logs = readSyncLog();
    logs.push({
        ...event,
        timestamp: new Date().toISOString()
    });
    // Keep only last 1000 entries
    if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
    }
    writeSyncLog(logs);
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sync surveys from client with conflict handling
app.post('/api/sync', (req, res) => {
    try {
        const { surveys, userId, deviceId } = req.body;

        if (!surveys || !Array.isArray(surveys)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Read existing surveys
        const existingSurveys = readSurveys();
        const conflicts = [];
        const synced = [];

        surveys.forEach(survey => {
            // Check for conflicts (same client ID already exists)
            const existingIndex = existingSurveys.findIndex(
                s => s.id === survey.id && s.deviceId === deviceId
            );

            if (existingIndex >= 0) {
                // Conflict detected - use server timestamp to resolve
                const existing = existingSurveys[existingIndex];
                if (new Date(survey.timestamp) > new Date(existing.timestamp)) {
                    // Client version is newer, update
                    existingSurveys[existingIndex] = {
                        ...survey,
                        serverTimestamp: new Date().toISOString(),
                        serverId: existing.serverId || `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        syncedBy: userId,
                        deviceId: deviceId,
                        conflictResolution: 'client-newer'
                    };
                    conflicts.push({ clientId: survey.id, resolution: 'client-newer' });
                } else {
                    // Server version is newer or same, keep server version
                    conflicts.push({ clientId: survey.id, resolution: 'server-newer' });
                }
            } else {
                // No conflict, add new survey
                const newSurvey = {
                    ...survey,
                    serverTimestamp: new Date().toISOString(),
                    serverId: `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    syncedBy: userId || 'anonymous',
                    deviceId: deviceId || 'unknown'
                };
                existingSurveys.push(newSurvey);
                synced.push(newSurvey.serverId);
            }
        });

        // Write to file
        if (writeSurveys(existingSurveys)) {
            // Log sync event
            logSyncEvent({
                type: 'sync',
                userId: userId || 'anonymous',
                deviceId: deviceId || 'unknown',
                surveyCount: surveys.length,
                syncedCount: synced.length,
                conflictCount: conflicts.length,
                success: true
            });

            console.log(`✅ Synced ${synced.length} surveys (${conflicts.length} conflicts). Total: ${existingSurveys.length}`);

            res.json({
                success: true,
                syncedCount: synced.length,
                conflictCount: conflicts.length,
                conflicts: conflicts,
                totalCount: existingSurveys.length,
                message: conflicts.length > 0
                    ? `Synced with ${conflicts.length} conflict(s) resolved`
                    : 'Data synced successfully'
            });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Sync error:', error);
        logSyncEvent({
            type: 'sync',
            error: error.message,
            success: false
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all surveys
app.get('/api/surveys', (req, res) => {
    try {
        const surveys = readSurveys();
        res.json({ surveys, count: surveys.length });
    } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).json({ error: 'Failed to fetch surveys' });
    }
});

// Get survey by server ID
app.get('/api/surveys/:serverId', (req, res) => {
    try {
        const surveys = readSurveys();
        const survey = surveys.find(s => s.serverId === req.params.serverId);

        if (survey) {
            res.json(survey);
        } else {
            res.status(404).json({ error: 'Survey not found' });
        }
    } catch (error) {
        console.error('Error fetching survey:', error);
        res.status(500).json({ error: 'Failed to fetch survey' });
    }
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    try {
        const surveys = readSurveys();

        const stats = {
            totalSurveys: surveys.length,
            totalFarmArea: surveys.reduce((sum, s) => sum + (parseFloat(s.farmSize) || 0), 0),
            totalFarmers: surveys.length,
            cropDistribution: {},
            livestockTotals: {
                cattle: 0,
                pigs: 0,
                poultry: 0,
                goats: 0
            },
            villageDistribution: {},
            pestIssues: {
                none: 0,
                pests: 0,
                disease: 0,
                both: 0
            }
        };

        surveys.forEach(survey => {
            // Crop distribution
            if (survey.crops) {
                survey.crops.forEach(crop => {
                    stats.cropDistribution[crop] = (stats.cropDistribution[crop] || 0) + 1;
                });
            }

            // Livestock totals
            stats.livestockTotals.cattle += parseInt(survey.cattle) || 0;
            stats.livestockTotals.pigs += parseInt(survey.pigs) || 0;
            stats.livestockTotals.poultry += parseInt(survey.poultry) || 0;
            stats.livestockTotals.goats += parseInt(survey.goats) || 0;

            // Village distribution
            if (survey.village) {
                stats.villageDistribution[survey.village] =
                    (stats.villageDistribution[survey.village] || 0) + 1;
            }

            // Pest issues
            stats.pestIssues[survey.pestIssues || 'none']++;
        });

        res.json(stats);
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// Export to CSV
app.get('/api/export/csv', (req, res) => {
    try {
        const surveys = readSurveys();

        const headers = [
            'Server ID', 'Client ID', 'Server Timestamp', 'Client Timestamp',
            'Farmer Name', 'Household Size', 'Phone', 'Village', 'Island',
            'Latitude', 'Longitude', 'Farm Size (ha)', 'Crops', 'Other Crops',
            'Production (kg)', 'Last Harvest', 'Cattle', 'Pigs', 'Poultry', 'Goats',
            'Pest Issues', 'Pest Severity', 'Pest Details', 'Notes', 'Synced By', 'Device ID'
        ];

        const rows = surveys.map(s => [
            s.serverId || '',
            s.id || '',
            s.serverTimestamp || '',
            s.timestamp || '',
            s.farmerName || '',
            s.householdSize || '',
            s.phoneNumber || '',
            s.village || '',
            s.island || '',
            s.latitude || '',
            s.longitude || '',
            s.farmSize || '',
            (s.crops || []).join('; '),
            s.otherCrops || '',
            s.productionQty || '',
            s.lastHarvest || '',
            s.cattle || 0,
            s.pigs || 0,
            s.poultry || 0,
            s.goats || 0,
            s.pestIssues || '',
            s.pestSeverity || '',
            s.pestDetails || '',
            s.notes || '',
            s.syncedBy || 'unknown',
            s.deviceId || 'unknown'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=agriculture_data_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Delete all surveys (for testing/reset)
app.delete('/api/surveys', (req, res) => {
    try {
        writeSurveys([]);
        res.json({ success: true, message: 'All surveys deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete surveys' });
    }
});

// ===== USER MANAGEMENT ENDPOINTS =====

// Get all users (admin only)
app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        // Remove passwords from response
        const safeUsers = users.map(u => {
            const { password, ...userData } = u;
            return userData;
        });
        res.json({ users: safeUsers, count: safeUsers.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
app.post('/api/users', (req, res) => {
    try {
        const { username, password, role, fullName, email } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const users = readUsers();

        // Check if username exists
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            id: `user-${Date.now()}`,
            username,
            password: hashPassword(password),
            role, // 'admin', 'supervisor', 'enumerator'
            fullName: fullName || username,
            email: email || '',
            createdAt: new Date().toISOString(),
            active: true
        };

        users.push(newUser);
        writeUsers(users);

        const { password: _, ...safeUser } = newUser;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
app.put('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex < 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user (don't allow password change here)
        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            id: users[userIndex].id, // Keep original ID
            password: users[userIndex].password // Keep original password
        };

        writeUsers(users);

        const { password, ...safeUser } = users[userIndex];
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const users = readUsers();
        const filteredUsers = users.filter(u => u.id !== id);

        if (filteredUsers.length === users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        writeUsers(filteredUsers);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ===== DASHBOARD ENDPOINTS =====

// Get dashboard data
app.get('/api/dashboard', (req, res) => {
    try {
        const surveys = readSurveys();
        const users = readUsers();
        const syncLogs = readSyncLog();

        // Calculate statistics
        const stats = {
            totalSurveys: surveys.length,
            totalFarmers: surveys.length,
            totalFarmArea: surveys.reduce((sum, s) => sum + (parseFloat(s.farmSize) || 0), 0).toFixed(2),
            totalUsers: users.length,
            activeEnumerators: users.filter(u => u.role === 'enumerator' && u.active).length,
            recentSyncs: syncLogs.slice(-10).reverse(),

            // Crop distribution
            cropDistribution: {},

            // Island distribution
            islandDistribution: {},

            // Livestock totals
            livestockTotals: {
                cattle: 0,
                pigs: 0,
                poultry: 0,
                goats: 0
            },

            // Village distribution
            villageDistribution: {},

            // Pest issues
            pestIssues: {
                none: 0,
                pests: 0,
                disease: 0,
                both: 0
            },

            // Recent surveys
            recentSurveys: surveys.slice(-10).reverse(),

            // GPS coordinates for map
            gpsPoints: surveys.filter(s => s.latitude && s.longitude).map(s => ({
                lat: parseFloat(s.latitude),
                lng: parseFloat(s.longitude),
                farmerName: s.farmerName,
                village: s.village,
                farmSize: s.farmSize,
                crops: s.crops
            }))
        };

        // Process surveys for distributions
        surveys.forEach(survey => {
            // Crops
            if (survey.crops) {
                survey.crops.forEach(crop => {
                    stats.cropDistribution[crop] = (stats.cropDistribution[crop] || 0) + 1;
                });
            }

            // Islands
            if (survey.island) {
                stats.islandDistribution[survey.island] = (stats.islandDistribution[survey.island] || 0) + 1;
            }

            // Livestock
            stats.livestockTotals.cattle += parseInt(survey.cattle) || 0;
            stats.livestockTotals.pigs += parseInt(survey.pigs) || 0;
            stats.livestockTotals.poultry += parseInt(survey.poultry) || 0;
            stats.livestockTotals.goats += parseInt(survey.goats) || 0;

            // Villages
            if (survey.village) {
                stats.villageDistribution[survey.village] = (stats.villageDistribution[survey.village] || 0) + 1;
            }

            // Pests
            if (survey.pestIssues) {
                stats.pestIssues[survey.pestIssues]++;
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Get farmer database (paginated)
app.get('/api/farmers', (req, res) => {
    try {
        const surveys = readSurveys();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';

        // Filter by search
        let filtered = surveys;
        if (search) {
            filtered = surveys.filter(s =>
                s.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
                s.village?.toLowerCase().includes(search.toLowerCase()) ||
                s.island?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginated = filtered.slice(startIndex, endIndex);

        res.json({
            farmers: paginated,
            total: filtered.length,
            page,
            limit,
            totalPages: Math.ceil(filtered.length / limit)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch farmers' });
    }
});

// ===== BACKUP & RECOVERY =====

// Create backup
app.post('/api/backup', (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

        const surveys = readSurveys();
        const users = readUsers();
        const syncLogs = readSyncLog();

        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                surveys,
                users,
                syncLogs
            }
        };

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        res.json({
            success: true,
            message: 'Backup created successfully',
            filename: `backup_${timestamp}.json`,
            recordCount: surveys.length
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// List backups
app.get('/api/backups', (req, res) => {
    try {
        const files = fs.readdirSync(backupDir);
        const backups = files
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .map(f => {
                const stats = fs.statSync(path.join(backupDir, f));
                return {
                    filename: f,
                    size: stats.size,
                    created: stats.birthtime
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json({ backups });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list backups' });
    }
});

// Restore from backup
app.post('/api/restore/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const backupFile = path.join(backupDir, filename);

        if (!fs.existsSync(backupFile)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

        // Restore data
        if (backup.data.surveys) writeSurveys(backup.data.surveys);
        if (backup.data.users) writeUsers(backup.data.users);
        if (backup.data.syncLogs) writeSyncLog(backup.data.syncLogs);

        res.json({
            success: true,
            message: 'Data restored successfully',
            recordCount: backup.data.surveys.length
        });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
});

// Get sync logs
app.get('/api/sync-logs', (req, res) => {
    try {
        const logs = readSyncLog();
        const limit = parseInt(req.query.limit) || 100;
        res.json({ logs: logs.slice(-limit).reverse() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sync logs' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌾 Agriculture Data System Server v2.0`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📡 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`);
    console.log(`\n📋 API Endpoints:`);
    console.log(`   Data Collection:`);
    console.log(`   - POST /api/sync              - Sync surveys with conflict handling`);
    console.log(`   - GET  /api/surveys           - Get all surveys`);
    console.log(`   - GET  /api/farmers           - Get farmer database (paginated)`);
    console.log(`   - GET  /api/statistics        - Get statistics`);
    console.log(`   - GET  /api/export/csv        - Export to CSV/Excel`);
    console.log(`\n   Dashboard:`);
    console.log(`   - GET  /api/dashboard         - Real-time dashboard data`);
    console.log(`   - GET  /api/sync-logs         - Sync history logs`);
    console.log(`\n   User Management:`);
    console.log(`   - GET    /api/users           - List all users`);
    console.log(`   - POST   /api/users           - Create new user`);
    console.log(`   - PUT    /api/users/:id       - Update user`);
    console.log(`   - DELETE /api/users/:id       - Delete user`);
    console.log(`\n   Backup & Recovery:`);
    console.log(`   - POST /api/backup            - Create backup`);
    console.log(`   - GET  /api/backups           - List backups`);
    console.log(`   - POST /api/restore/:filename - Restore backup`);
    console.log(`\n💾 Data Storage:`);
    console.log(`   - Surveys: ${dataDir}/surveys.json`);
    console.log(`   - Users: ${dataDir}/users.json`);
    console.log(`   - Sync Logs: ${dataDir}/sync_log.json`);
    console.log(`   - Backups: ${backupDir}/`);
    console.log(`\n👤 Default Admin Credentials:`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin123 (⚠️  Change immediately!)`);
    console.log(`\n${'='.repeat(60)}\n`);
});
