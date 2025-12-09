const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-use-env-file';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Hash password using bcrypt with salt rounds
async function hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Compare password with hash
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Generate JWT access token
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name || user.fullName,
        type: 'access'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Generate JWT refresh token
function generateRefreshToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        type: 'refresh'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

// Generate both access and refresh tokens
function generateTokenPair(user) {
    return {
        accessToken: generateToken(user),
        refreshToken: generateRefreshToken(user),
        expiresIn: JWT_EXPIRY
    };
}

// Verify JWT token
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

// Refresh access token using refresh token
function refreshAccessToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return null;
        }

        // Generate new access token
        return generateToken({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            fullName: decoded.fullName
        });
    } catch (error) {
        return null;
    }
}

// Authentication middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
}

// Role-based authorization middleware
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    generateRefreshToken,
    generateTokenPair,
    verifyToken,
    refreshAccessToken,
    authenticate,
    authorize,
    optionalAuth
};
