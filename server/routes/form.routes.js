const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../auth');
const { pool } = require('../database');

// Get all form templates
router.get('/', authenticate, async (req, res) => {
    try {
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
router.get('/:id', authenticate, async (req, res) => {
    try {
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
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, questions } = req.body;

        if (!title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Title and questions array are required' });
        }

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
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, description, questions } = req.body;

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
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), async (req, res) => {
    try {
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

// Publish form
router.post('/:id/publish', authenticate, authorize('admin', 'supervisor'), async (req, res) => {
    try {
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
router.get('/published/list', optionalAuth, async (req, res) => {
    try {
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

module.exports = router;
