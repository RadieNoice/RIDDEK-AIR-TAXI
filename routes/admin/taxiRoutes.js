const express = require('express');
const router = express.Router();
const Taxi = require('../../models/Taxi');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validation');

// Get all taxis
router.get('/taxis', [isAuthenticated, isAdmin], async (req, res) => {
    try {
        const taxis = await Taxi.find().populate('currentLocation', 'name coordinates');
        res.json({ success: true, data: taxis });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching taxis' });
    }
});

// Add a new taxi
router.post('/taxis', [isAuthenticated, isAdmin], async (req, res) => {
    const { vehicleModel, licensePlate, capacity, baseRate, status, currentLocation } = req.body;
    const existingTaxi = await Taxi.findOne({ licensePlate });
    if (existingTaxi) return res.status(400).json({ success: false, message: 'Taxi already exists' });

    const newTaxi = new Taxi({ vehicleModel, licensePlate, capacity, baseRate, status, currentLocation });
    await newTaxi.save();
    res.status(201).json({ success: true, message: 'Taxi added successfully', data: newTaxi });
});

// Update taxi
router.put('/taxis/:id', [isAuthenticated, isAdmin, validateObjectId], async (req, res) => {
    const { vehicleModel, licensePlate, capacity, baseRate, status, currentLocation } = req.body;
    const updatedTaxi = await Taxi.findByIdAndUpdate(req.params.id, { vehicleModel, licensePlate, capacity, baseRate, status, currentLocation }, { new: true });
    if (!updatedTaxi) return res.status(404).json({ success: false, message: 'Taxi not found' });

    res.json({ success: true, message: 'Taxi updated successfully', data: updatedTaxi });
});

// Delete taxi
router.delete('/taxis/:id', [isAuthenticated, isAdmin, validateObjectId], async (req, res) => {
    const taxi = await Taxi.findByIdAndDelete(req.params.id);
    if (!taxi) return res.status(404).json({ success: false, message: 'Taxi not found' });

    res.json({ success: true, message: 'Taxi deleted successfully' });
});

module.exports = router;
