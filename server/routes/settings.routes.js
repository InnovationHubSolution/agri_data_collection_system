const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../auth');
const { pool } = require('../database');

// Get all settings
router.get('/', authenticate, async (req, res) => {
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
router.post('/global-note', authenticate, authorize('admin'), async (req, res) => {
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
router.post('/web-interview', authenticate, authorize('admin'), async (req, res) => {
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

module.exports = router;
