const express = require('express');
const router = express.Router();
const {
    hashPassword,
    comparePassword,
    generateTokenPair,
    refreshAccessToken,
    authenticate
} = require('../auth');
const { userOperations } = require('../database');
const { validate, userValidation } = require('../validation');

// Login
router.post('/login', userValidation.login, validate, async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await userOperations.getByUsername(username);

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await userOperations.updateLastLogin(user.id);
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

// Refresh token
router.post('/refresh', async (req, res) => {
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
router.get('/verify', authenticate, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const user = await userOperations.getById(req.user.id);
        const isValid = await comparePassword(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        const hashedPassword = await hashPassword(newPassword);
        await userOperations.update(req.user.id, { password: hashedPassword });

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;
