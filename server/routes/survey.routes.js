const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../auth');
const { surveyOperations, photoOperations, syncLogOperations } = require('../database');
const { validate, surveyValidation } = require('../validation');

// Sync surveys (allows optional auth for backward compatibility)
router.post('/sync', optionalAuth, async (req, res) => {
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

// Get all surveys (with filters)
router.get('/surveys', authenticate, async (req, res) => {
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
router.get('/surveys/nearby', authenticate, async (req, res) => {
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

// Get statistics
router.get('/statistics', authenticate, async (req, res) => {
    try {
        const stats = await surveyOperations.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
