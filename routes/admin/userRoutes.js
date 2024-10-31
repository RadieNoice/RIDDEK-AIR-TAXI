const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

// Promote user to admin
router.put('/promoteUser', [isAuthenticated, isAdmin], async (req, res) => {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'admin';
    await user.save();
    res.json({ success: true, message: 'User promoted to admin successfully' });
});

module.exports = router;
