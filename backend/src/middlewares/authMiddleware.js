const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/auth');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded; // Contains id, role, etc.
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };
