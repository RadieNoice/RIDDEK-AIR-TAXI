// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Destructure environment variables
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

/**
 * Middleware to authenticate JWT tokens.
 * It verifies the token, retrieves the user from the database,
 * and attaches the user object to the request for further use.
 */
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present and properly formatted
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            // Verify the token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Retrieve the user from the database
            const user = await User.findById(decoded.userId).select('-password'); // Ensure correct field

            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found.' });
            }

            // Attach user to the request object
            req.user = user;
            next();
        } catch (error) {
            console.error('JWT authentication error:', error.message);

            // Handle specific JWT errors
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token has expired.' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token.' });
            } else {
                return res.status(500).json({ success: false, message: 'Server error during authentication.' });
            }
        }
    } else {
        return res.status(401).json({ success: false, message: 'Authorization header missing or malformed.' });
    }
};

/**
 * Middleware to authorize users based on their roles.
 * Usage: authorizeRoles('admin', 'manager')
 * @param  {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions.' });
        }

        next();
    };
};

/**
 * Function to generate JWT tokens.
 * Use this function when logging in or registering users.
 * @param {Object} user - The user object
 * @returns {String} - Signed JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN || '24h' }
    );
};
console.log('🚀 Loaded JWT_SECRET:', JWT_SECRET);


module.exports = { authenticateJWT, authorizeRoles, generateToken };
