const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
}

// User validation rules
const userValidation = {
    create: [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be 3-50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
        body('role')
            .isIn(['admin', 'supervisor', 'enumerator'])
            .withMessage('Invalid role'),
        body('fullName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Full name too long'),
        body('province')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Province name too long')
    ],
    login: [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    update: [
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be 3-50 characters'),
        body('password')
            .optional()
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        body('role')
            .optional()
            .isIn(['admin', 'supervisor', 'enumerator'])
            .withMessage('Invalid role'),
        body('fullName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Full name too long')
    ]
};

// Survey validation rules
const surveyValidation = {
    create: [
        body('farmerName')
            .trim()
            .notEmpty()
            .withMessage('Farmer name is required')
            .isLength({ max: 100 })
            .withMessage('Farmer name too long'),
        body('village')
            .trim()
            .notEmpty()
            .withMessage('Village is required')
            .isLength({ max: 100 })
            .withMessage('Village name too long'),
        body('island')
            .trim()
            .notEmpty()
            .withMessage('Island is required')
            .isIn(['Efate', 'Tanna', 'Malekula', 'Espiritu Santo', 'Pentecost', 'Ambrym', 'Epi', 'Other'])
            .withMessage('Invalid island'),
        body('phoneNumber')
            .optional()
            .trim()
            .matches(/^[0-9+\-\s()]+$/)
            .withMessage('Invalid phone number format'),
        body('latitude')
            .notEmpty()
            .withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('longitude')
            .notEmpty()
            .withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        body('farmSize')
            .notEmpty()
            .withMessage('Farm size is required')
            .isFloat({ min: 0.1, max: 10000 })
            .withMessage('Farm size must be between 0.1 and 10000 hectares'),
        body('crops')
            .isArray()
            .withMessage('Crops must be an array')
            .notEmpty()
            .withMessage('At least one crop must be selected'),
        body('crops.*')
            .isIn(['copra', 'kava', 'cocoa', 'coffee', 'taro', 'yam', 'manioc', 'banana'])
            .withMessage('Invalid crop type'),
        body('cattleCount')
            .optional()
            .isInt({ min: 0, max: 10000 })
            .withMessage('Invalid cattle count'),
        body('pigsCount')
            .optional()
            .isInt({ min: 0, max: 10000 })
            .withMessage('Invalid pigs count'),
        body('chickensCount')
            .optional()
            .isInt({ min: 0, max: 100000 })
            .withMessage('Invalid chickens count'),
        body('goatsCount')
            .optional()
            .isInt({ min: 0, max: 10000 })
            .withMessage('Invalid goats count'),
        body('pestIssues')
            .optional()
            .isIn(['none', 'pests', 'disease', 'both'])
            .withMessage('Invalid pest issue type'),
        body('pestType')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Pest type description too long'),
        body('pestSeverity')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid pest severity'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Notes too long')
    ],
    sync: [
        body('surveys')
            .isArray()
            .withMessage('Surveys must be an array')
            .notEmpty()
            .withMessage('At least one survey required'),
        body('deviceId')
            .trim()
            .notEmpty()
            .withMessage('Device ID is required')
            .isLength({ max: 100 })
            .withMessage('Device ID too long'),
        body('userId')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('User ID too long')
    ]
};

// Pagination validation
const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000')
        .toInt(),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search term too long')
];

// ID parameter validation
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID')
        .toInt()
];

// Sanitize input to prevent XSS
function sanitizeInput(value) {
    if (typeof value === 'string') {
        return value
            .replace(/[<>]/g, '') // Remove < and >
            .trim();
    }
    return value;
}

// Middleware to sanitize all request bodies
function sanitizeBody(req, res, next) {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitizeInput(req.body[key]);
        });
    }
    next();
}

module.exports = {
    validate,
    userValidation,
    surveyValidation,
    paginationValidation,
    idValidation,
    sanitizeBody
};
