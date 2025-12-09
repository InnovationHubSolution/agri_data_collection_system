const { Pool } = require('pg');
const format = require('pg-format');

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriculture_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Initialize database schema with PostGIS
async function initializeDatabase() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Enable PostGIS extension
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');

        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'supervisor', 'enumerator')),
                full_name VARCHAR(200),
                email VARCHAR(200),
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT true,
                last_login TIMESTAMP
            );
        `);

        // Form templates table
        await client.query(`
            CREATE TABLE IF NOT EXISTS form_templates (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                questions JSONB NOT NULL DEFAULT '[]',
                created_by VARCHAR(50) REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                published_by VARCHAR(50) REFERENCES users(id)
            );
        `);

        // Add indexes for form templates
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_form_templates_published ON form_templates(published);
            CREATE INDEX IF NOT EXISTS idx_form_templates_created_at ON form_templates(created_at);
            CREATE INDEX IF NOT EXISTS idx_form_templates_updated_at ON form_templates(updated_at);
            CREATE INDEX IF NOT EXISTS idx_form_templates_created_by ON form_templates(created_by);
        `);

        // Surveys table with PostGIS geometry
        await client.query(`
            CREATE TABLE IF NOT EXISTS surveys (
                id SERIAL PRIMARY KEY,
                client_id VARCHAR(100),
                device_id VARCHAR(100),
                user_id VARCHAR(50) REFERENCES users(id),
                farmer_name VARCHAR(200) NOT NULL,
                household_size INTEGER,
                phone VARCHAR(50),
                village VARCHAR(100),
                island VARCHAR(100),
                location GEOMETRY(Point, 4326),
                latitude NUMERIC(10, 8),
                longitude NUMERIC(11, 8),
                gps_accuracy NUMERIC(10, 2),
                farm_size NUMERIC(10, 2),
                crops JSONB,
                livestock JSONB,
                pest_issues VARCHAR(50),
                pest_severity VARCHAR(20),
                pest_description TEXT,
                treatment_used TEXT,
                harvest_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                synced_at TIMESTAMP,
                synced_by VARCHAR(50),
                UNIQUE(client_id, device_id)
            );
        `);

        // Create spatial index on location
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_surveys_location 
            ON surveys USING GIST (location);
        `);

        // Create indexes for common queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_surveys_island ON surveys(island);
            CREATE INDEX IF NOT EXISTS idx_surveys_village ON surveys(village);
            CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
            CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_surveys_farmer_name ON surveys(farmer_name);
        `);

        // Photos table
        await client.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
                photo_data TEXT NOT NULL,
                photo_type VARCHAR(50),
                caption TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Sync logs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sync_logs (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                user_id VARCHAR(50),
                device_id VARCHAR(100),
                survey_count INTEGER,
                success BOOLEAN DEFAULT true,
                error_message TEXT,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create updated_at trigger function
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Add trigger to surveys table
        await client.query(`
            DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
            CREATE TRIGGER update_surveys_updated_at
                BEFORE UPDATE ON surveys
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Add trigger to users table
        await client.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        await client.query('COMMIT');
        console.log('✅ Database schema initialized successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Survey operations
const surveyOperations = {
    // Create or update survey
    async upsert(survey) {
        const client = await pool.connect();
        try {
            const {
                clientId, deviceId, userId, farmerName, householdSize, phone,
                village, island, latitude, longitude, gpsAccuracy, farmSize,
                crops, livestock, pestIssues, pestSeverity, pestDescription,
                treatmentUsed, harvestDate, notes
            } = survey;

            // Check for existing survey
            const existing = await client.query(
                'SELECT id, updated_at FROM surveys WHERE client_id = $1 AND device_id = $2',
                [clientId, deviceId]
            );

            let result;
            const location = latitude && longitude
                ? `SRID=4326;POINT(${longitude} ${latitude})`
                : null;

            if (existing.rows.length > 0) {
                // Update existing
                result = await client.query(`
                    UPDATE surveys SET
                        user_id = $1, farmer_name = $2, household_size = $3, phone = $4,
                        village = $5, island = $6, location = ST_GeomFromEWKT($7),
                        latitude = $8, longitude = $9, gps_accuracy = $10, farm_size = $11,
                        crops = $12, livestock = $13, pest_issues = $14, pest_severity = $15,
                        pest_description = $16, treatment_used = $17, harvest_date = $18,
                        notes = $19, synced_at = CURRENT_TIMESTAMP, synced_by = $20
                    WHERE client_id = $21 AND device_id = $22
                    RETURNING *
                `, [
                    userId, farmerName, householdSize, phone, village, island, location,
                    latitude, longitude, gpsAccuracy, farmSize, JSON.stringify(crops),
                    JSON.stringify(livestock), pestIssues, pestSeverity, pestDescription,
                    treatmentUsed, harvestDate, notes, userId, clientId, deviceId
                ]);
            } else {
                // Insert new
                result = await client.query(`
                    INSERT INTO surveys (
                        client_id, device_id, user_id, farmer_name, household_size, phone,
                        village, island, location, latitude, longitude, gps_accuracy, farm_size,
                        crops, livestock, pest_issues, pest_severity, pest_description,
                        treatment_used, harvest_date, notes, synced_at, synced_by
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, ST_GeomFromEWKT($9), $10, $11, $12, $13,
                        $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP, $22
                    )
                    RETURNING *
                `, [
                    clientId, deviceId, userId, farmerName, householdSize, phone, village, island,
                    location, latitude, longitude, gpsAccuracy, farmSize, JSON.stringify(crops),
                    JSON.stringify(livestock), pestIssues, pestSeverity, pestDescription,
                    treatmentUsed, harvestDate, notes, userId
                ]);
            }

            return {
                survey: result.rows[0],
                isNew: existing.rows.length === 0
            };

        } finally {
            client.release();
        }
    },

    // Get all surveys with optional filters
    async getAll(filters = {}) {
        const { page = 1, limit = 50, search, island, village, userId, startDate, endDate } = filters;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(farmer_name ILIKE $${paramIndex} OR village ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (island) {
            whereConditions.push(`island = $${paramIndex}`);
            params.push(island);
            paramIndex++;
        }

        if (village) {
            whereConditions.push(`village = $${paramIndex}`);
            params.push(village);
            paramIndex++;
        }

        if (userId) {
            whereConditions.push(`user_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`created_at >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`created_at <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const countQuery = `SELECT COUNT(*) FROM surveys ${whereClause}`;
        const dataQuery = `
            SELECT s.*, u.full_name as enumerator_name
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.id
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, params),
            pool.query(dataQuery, [...params, limit, offset])
        ]);

        return {
            surveys: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        };
    },

    // Get dashboard statistics
    async getStatistics() {
        const stats = await pool.query(`
            SELECT
                COUNT(*) as total_surveys,
                SUM(farm_size) as total_farm_area,
                COUNT(DISTINCT user_id) as active_enumerators,
                COUNT(DISTINCT island) as islands_covered,
                COUNT(DISTINCT village) as villages_covered,
                AVG(farm_size) as avg_farm_size,
                COUNT(CASE WHEN pest_issues IS NOT NULL AND pest_issues != 'none' THEN 1 END) as surveys_with_pests
            FROM surveys
        `);

        // Crop distribution
        const cropDist = await pool.query(`
            SELECT 
                jsonb_array_elements_text(crops) as crop,
                COUNT(*) as count
            FROM surveys
            WHERE crops IS NOT NULL
            GROUP BY crop
            ORDER BY count DESC
        `);

        // Island distribution
        const islandDist = await pool.query(`
            SELECT island, COUNT(*) as count
            FROM surveys
            WHERE island IS NOT NULL
            GROUP BY island
            ORDER BY count DESC
        `);

        // Village distribution
        const villageDist = await pool.query(`
            SELECT village, COUNT(*) as count
            FROM surveys
            WHERE village IS NOT NULL
            GROUP BY village
            ORDER BY count DESC
            LIMIT 10
        `);

        // Livestock totals
        const livestockData = await pool.query(`
            SELECT 
                SUM((livestock->>'cattle')::int) as cattle,
                SUM((livestock->>'pigs')::int) as pigs,
                SUM((livestock->>'chickens')::int) as chickens,
                SUM((livestock->>'goats')::int) as goats
            FROM surveys
            WHERE livestock IS NOT NULL
        `);

        // Pest issues distribution
        const pestDist = await pool.query(`
            SELECT pest_issues, pest_severity, COUNT(*) as count
            FROM surveys
            WHERE pest_issues IS NOT NULL AND pest_issues != 'none'
            GROUP BY pest_issues, pest_severity
            ORDER BY count DESC
        `);

        // GPS points for map
        const gpsPoints = await pool.query(`
            SELECT 
                id, farmer_name, village, island, latitude, longitude,
                ST_X(location::geometry) as lng,
                ST_Y(location::geometry) as lat
            FROM surveys
            WHERE location IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1000
        `);

        // Recent surveys
        const recentSurveys = await pool.query(`
            SELECT s.id, s.farmer_name, s.village, s.island, s.farm_size,
                   s.created_at, u.full_name as enumerator
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

        return {
            summary: stats.rows[0],
            cropDistribution: cropDist.rows,
            islandDistribution: islandDist.rows,
            villageDistribution: villageDist.rows,
            livestock: livestockData.rows[0],
            pestIssues: pestDist.rows,
            gpsPoints: gpsPoints.rows,
            recentSurveys: recentSurveys.rows
        };
    },

    // Spatial queries
    async findNearby(latitude, longitude, radiusKm = 10) {
        const result = await pool.query(`
            SELECT 
                id, farmer_name, village, island, latitude, longitude, farm_size,
                ST_Distance(
                    location::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) / 1000 as distance_km
            FROM surveys
            WHERE location IS NOT NULL
                AND ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3 * 1000
                )
            ORDER BY distance_km
        `, [longitude, latitude, radiusKm]);

        return result.rows;
    },

    // Export to CSV
    async exportToCSV() {
        const result = await pool.query(`
            SELECT 
                s.id, s.farmer_name, s.household_size, s.phone, s.village, s.island,
                s.latitude, s.longitude, s.gps_accuracy, s.farm_size,
                s.crops, s.livestock, s.pest_issues, s.pest_severity,
                s.pest_description, s.treatment_used, s.harvest_date, s.notes,
                s.created_at, s.synced_at, u.full_name as enumerator,
                s.device_id
            FROM surveys s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);

        return result.rows;
    }
};

// User operations
const userOperations = {
    async create(user) {
        const result = await pool.query(`
            INSERT INTO users (id, username, password, role, full_name, email, phone, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [user.id, user.username, user.password, user.role, user.fullName, user.email, user.phone, user.active !== false]);

        return result.rows[0];
    },

    async getAll() {
        const result = await pool.query(`
            SELECT id, username, role, full_name, email, phone, created_at, active, last_login
            FROM users
            ORDER BY created_at DESC
        `);
        return result.rows;
    },

    async getById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    async getByUsername(username) {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    },

    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });

        values.push(id);

        const result = await pool.query(`
            UPDATE users SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);

        return result.rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
    },

    async updateLastLogin(id) {
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    }
};

// Sync log operations
const syncLogOperations = {
    async create(log) {
        await pool.query(`
            INSERT INTO sync_logs (event_type, user_id, device_id, survey_count, success, error_message, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [log.eventType, log.userId, log.deviceId, log.surveyCount, log.success, log.errorMessage, log.ipAddress]);
    },

    async getRecent(limit = 100) {
        const result = await pool.query(`
            SELECT sl.*, u.full_name as user_name
            FROM sync_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            ORDER BY sl.created_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows;
    }
};

// Photo operations
const photoOperations = {
    async create(surveyId, photos) {
        if (!photos || photos.length === 0) return;

        const values = photos.map(photo => [
            surveyId,
            photo.data || photo.photoData,
            photo.type || 'field',
            photo.caption || null
        ]);

        await pool.query(
            format('INSERT INTO photos (survey_id, photo_data, photo_type, caption) VALUES %L', values)
        );
    },

    async getBySurveyId(surveyId) {
        const result = await pool.query(
            'SELECT id, photo_type, caption, created_at FROM photos WHERE survey_id = $1',
            [surveyId]
        );
        return result.rows;
    }
};

module.exports = {
    pool,
    initializeDatabase,
    surveyOperations,
    userOperations,
    syncLogOperations,
    photoOperations
};
