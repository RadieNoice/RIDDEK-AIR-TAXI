const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Taxi = require('../models/Taxi');

// POST /api/availableTaxis
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { pickup, drop } = req.body;

        // Validate input
        if (!pickup || !drop) {
            return res.status(400).json({
                success: false,
                message: 'Pickup location and drop location are required.'
            });
        }

        // Search for available taxis matching criteria
        const taxis = await Taxi.find({
            status: 'available',
            $and: [
                {
                    $or: [
                        { sourceLocation: { $regex: new RegExp(pickup.trim(), 'i') } },
                        { sourceLocation: { $regex: new RegExp(pickup.trim().replace(/\s+/g, '.*'), 'i') } }
                    ]
                },
                {
                    $or: [
                        { destinationLocation: { $regex: new RegExp(drop.trim(), 'i') } },
                        { destinationLocation: { $regex: new RegExp(drop.trim().replace(/\s+/g, '.*'), 'i') } }
                    ]
                }
            ]
        }).sort({ capacity: 1 }); // Sort by capacity to show most efficient options first
        res.json({
            success: true,
            taxis: taxis
        });

    } catch (error) {
        console.error('Error fetching available taxis:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching taxis.'
        });
    }
});

module.exports = router;
