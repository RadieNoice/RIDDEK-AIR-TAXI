// routes/admin.js

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Import Models
const User = require('../models/User');
const Location = require('../models/Location');
const Taxi = require('../models/Taxi');
const Booking = require('../models/Booking');

// **Promote User to Admin**
router.put('/promoteUser', [
    body('username').notEmpty().trim().escape().withMessage('Username is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'User is already an admin' });
        }

        user.role = 'admin';
        await user.save();

        res.json({ success: true, message: 'User promoted to admin successfully', user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({ success: false, message: 'Server error while promoting user' });
    }
});

// **Add a New Taxi**
router.post('/taxis', [
    body('vehicleModel').trim().notEmpty().withMessage('Vehicle model is required'),
    body('licensePlate').trim().notEmpty().withMessage('License plate is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('status').isIn(['available', 'unavailable']).withMessage('Status must be either available or unavailable'),
    body('sourceLocation').trim().notEmpty().withMessage('Source location is required'),
    body('destinationLocation').trim().notEmpty().withMessage('Destination location is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { vehicleModel, licensePlate, capacity, status, sourceLocation, destinationLocation } = req.body;

        const existingTaxi = await Taxi.findOne({ licensePlate });
        if (existingTaxi) {
            return res.status(400).json({ success: false, message: 'Taxi with this license plate already exists' });
        }

        const newTaxi = new Taxi({
            vehicleModel,
            licensePlate,
            capacity,
            status,
            sourceLocation,
            destinationLocation
        });

        await newTaxi.save();

        res.status(201).json({ success: true, message: 'Taxi added successfully', taxi: newTaxi });
    } catch (error) {
        console.error('Error adding taxi:', error);
        res.status(500).json({ success: false, message: 'Server error while adding taxi' });
    }
});

// **Get All Taxis**
router.get('/taxis', async (req, res) => {
    try {
        const taxis = await Taxi.find().sort({ createdAt: -1 });
        res.json({ success: true, data: taxis });
    } catch (error) {
        console.error('Error fetching taxis:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching taxis' });
    }
});

module.exports = router;
