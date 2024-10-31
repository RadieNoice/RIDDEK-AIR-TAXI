const express = require('express');
const router = express.Router();
const Location = require('../../models/Location');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

// Get all locations
router.get('/locations', [isAuthenticated, isAdmin], async (req, res) => {
    try {
        const locations = await Location.find();
        res.json({ success: true, data: locations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching locations' });
    }
});

// Add a new location
router.post('/locations', [isAuthenticated, isAdmin], async (req, res) => {
    const { name, type, coordinates } = req.body;
    const existingLocation = await Location.findOne({ name });
    if (existingLocation) return res.status(400).json({ success: false, message: 'Location already exists' });

    const newLocation = new Location({ name, type, coordinates });
    await newLocation.save();
    res.status(201).json({ success: true, message: 'Location added successfully', data: newLocation });
});

module.exports = router;
