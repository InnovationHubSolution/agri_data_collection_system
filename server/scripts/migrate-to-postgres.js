const fs = require('fs');
const path = require('path');
const { pool, initializeDatabase, surveyOperations, userOperations } = require('../database');

async function migrateFromJSON() {
    console.log('🔄 Starting migration from JSON to PostgreSQL...\n');

    try {
        // Initialize database
        await initializeDatabase();

        // Read JSON files
        const dataDir = path.join(__dirname, '../data');
        const surveysFile = path.join(dataDir, 'surveys.json');
        const usersFile = path.join(dataDir, 'users.json');

        let migratedSurveys = 0;
        let migratedUsers = 0;

        // Migrate users
        if (fs.existsSync(usersFile)) {
            console.log('📋 Migrating users...');
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

            for (const user of users) {
                try {
                    await userOperations.create({
                        id: user.id,
                        username: user.username,
                        password: user.password,
                        role: user.role,
                        fullName: user.fullName || user.full_name,
                        email: user.email,
                        phone: user.phone,
                        active: user.active !== false
                    });
                    migratedUsers++;
                    console.log(`  ✓ Migrated user: ${user.username}`);
                } catch (error) {
                    if (error.code === '23505') { // Unique violation
                        console.log(`  ⚠ User already exists: ${user.username}`);
                    } else {
                        console.error(`  ✗ Error migrating user ${user.username}:`, error.message);
                    }
                }
            }
        }

        // Migrate surveys
        if (fs.existsSync(surveysFile)) {
            console.log('\n📋 Migrating surveys...');
            const surveys = JSON.parse(fs.readFileSync(surveysFile, 'utf8'));

            for (const survey of surveys) {
                try {
                    await surveyOperations.upsert({
                        clientId: survey.clientId || `imported-${Date.now()}-${Math.random()}`,
                        deviceId: survey.deviceId || 'json-import',
                        userId: survey.userId || survey.syncedBy,
                        farmerName: survey.farmerName,
                        householdSize: survey.householdSize,
                        phone: survey.phone,
                        village: survey.village,
                        island: survey.island,
                        latitude: survey.latitude,
                        longitude: survey.longitude,
                        gpsAccuracy: survey.gpsAccuracy,
                        farmSize: survey.farmSize,
                        crops: Array.isArray(survey.crops) ? survey.crops : [],
                        livestock: survey.livestock || {},
                        pestIssues: survey.pestIssues,
                        pestSeverity: survey.pestSeverity,
                        pestDescription: survey.pestDescription,
                        treatmentUsed: survey.treatmentUsed,
                        harvestDate: survey.harvestDate,
                        notes: survey.notes
                    });
                    migratedSurveys++;
                    console.log(`  ✓ Migrated survey: ${survey.farmerName}`);
                } catch (error) {
                    console.error(`  ✗ Error migrating survey ${survey.farmerName}:`, error.message);
                }
            }
        }

        console.log('\n✅ Migration completed!');
        console.log(`   Users migrated: ${migratedUsers}`);
        console.log(`   Surveys migrated: ${migratedSurveys}`);
        console.log('\n💡 You can now start using the PostgreSQL backend');
        console.log('   Run: npm run server:postgres\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
migrateFromJSON();
