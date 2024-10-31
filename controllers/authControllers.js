const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/auth'); // Ensure correct path
const User = require('../models/User'); // Your User model

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Authenticate user (find by username)
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password (implement your own logic)
        const isValid = await user.isValidPassword(password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = generateToken(user);

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { login };
