const express = require('express');
const router = express.Router();
const { authenticate } = require('../auth');
const { surveyOperations, userOperations } = require('../database');

// Get dashboard statistics
router.get('/', authenticate, async (req, res) => {
    try {
        const stats = await surveyOperations.getStatistics();
        const users = await userOperations.getAll();
        stats.summary.total_users = users.length;
        res.json(stats);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

module.exports = router;
