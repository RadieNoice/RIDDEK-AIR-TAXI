// routes/bookings.js

const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Taxi = require('../models/Taxi');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/bookings
 * @desc    Confirm a booking
 * @access  Private
 */
router.post(
    '/',
    authenticateJWT,
    [
        body('pickup').notEmpty().withMessage('Pickup location is required.'),
        body('drop').notEmpty().withMessage('Drop location is required.'),
        body('date').isISO8601().withMessage('Valid date is required.'),
        body('time').matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required (HH:mm).'),
        body('passengers').isInt({ min: 1 }).withMessage('At least one passenger is required.'),
        body('taxiId').isMongoId().withMessage('Valid Taxi ID is required.')
    ],
    async (req, res) => {
        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('📋 Validation Errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { pickup, drop, date, time, passengers, taxiId } = req.body;

            // Verify taxi availability
            const taxi = await Taxi.findById(taxiId);
            if (!taxi || taxi.status !== 'available') {
                console.warn(`🚫 Taxi not available: ID ${taxiId}`);
                return res.status(400).json({
                    success: false,
                    message: 'Selected taxi is not available.'
                });
            }

            // Create new booking
            const newBooking = new Booking({
                userId: req.user._id,
                name: req.user.username, // Assuming 'username' is used as name
                pickup,
                drop,
                date,
                time,
                passengers,
                taxiId,
                status: 'confirmed'
            });

            await newBooking.save();

            // Update taxi status to 'booked'
            taxi.status = 'booked';
            await taxi.save();

            console.log(`✅ Booking confirmed: ID ${newBooking._id}`);
            res.status(201).json({
                success: true,
                booking: newBooking,
                message: 'Booking confirmed successfully.'
            });

        } catch (error) {
            console.error('❌ Error confirming booking:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while confirming booking.'
            });
        }
    }
);

module.exports = router;
