// Server optimization middleware
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Response compression
function enableCompression() {
    return compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6,
    });
}

// Security headers
function enableSecurity() {
    return helmet({
        contentSecurityPolicy: false, // Disable for development
        crossOriginEmbedderPolicy: false,
    });
}

// Rate limiting
function createRateLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
        windowMs,
        max,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
}

// Request logging middleware
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';

        console.log(`[${logLevel.toUpperCase()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

// Cache middleware for GET requests
function cacheMiddleware(duration = 60) {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            cache.set(key, body, duration);
            return originalJson(body);
        };

        next();
    };
}

// Simple in-memory cache
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(key, value, ttlSeconds = 60) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000),
        });
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new SimpleCache();

module.exports = {
    enableCompression,
    enableSecurity,
    createRateLimiter,
    requestLogger,
    errorHandler,
    cacheMiddleware,
    cache,
};
