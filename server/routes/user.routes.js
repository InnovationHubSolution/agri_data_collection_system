const express = require('express');
const router = express.Router();
const { authenticate, authorize, hashPassword } = require('../auth');
const { userOperations } = require('../database');
const { validate, userValidation } = require('../validation');

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await userOperations.getById(req.user.id);
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
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        const updates = {};

        if (fullName) updates.full_name = fullName;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;

        const updated = await userOperations.update(req.user.id, updates);

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
router.get('/', authenticate, authorize('admin', 'supervisor'), async (req, res) => {
    try {
        const users = await userOperations.getAll();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user (admin only)
router.post('/', authenticate, authorize('admin'), userValidation.create, validate, async (req, res) => {
    try {
        const { username, password, role, fullName, email, phone } = req.body;

        const existing = await userOperations.getByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

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
router.put('/:id', authenticate, authorize('admin'), userValidation.update, validate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        if (req.body.fullName) updates.full_name = req.body.fullName;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.phone) updates.phone = req.body.phone;
        if (req.body.role) updates.role = req.body.role;
        if (req.body.active !== undefined) updates.active = req.body.active;

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
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
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

module.exports = router;
