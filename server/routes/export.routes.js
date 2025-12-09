const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../auth');
const { surveyOperations, userOperations, pool } = require('../database');

// Export surveys CSV
router.get('/csv', authenticate, async (req, res) => {
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
router.get('/json', authenticate, async (req, res) => {
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

// Export GeoJSON
router.get('/geojson', authenticate, async (req, res) => {
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

// Export users (admin only)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
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
router.get('/forms', authenticate, async (req, res) => {
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

module.exports = router;
