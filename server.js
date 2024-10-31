// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { body, validationResult, query, param } = require('express-validator');
const app = express();
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const availabilityValidationRules = [
    body('pickup').notEmpty().trim().withMessage('Pickup location is required'),
    body('drop').notEmpty().trim().withMessage('Drop location is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time (HH:mm) is required'),
    body('passengers').isInt({ min: 1, max: 6 }).withMessage('Valid number of passengers (1-6) is required')
];

// MongoDB Connection with error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taxi-booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Import Models
const User = require('./models/User');
const Booking = require('./models/Booking');
const Location = require('./models/Location');
const Taxi = require('./models/Taxi'); // Ensure Taxi model is imported


// Import Middleware and Helper Functions
const { authenticateJWT, authorizeRoles, generateToken } = require('./middleware/auth');

// Import Routes
// Import Routes
const adminRoutes = require('./routes/admin'); // Ensure this route exists
const availableTaxisRoute = require('./routes/availableTaxis'); // Ensure this route exists
const bookingsRoute = require('./routes/bookings'); // Ensure this route exists


// Mount Routes Correctly
app.use('/api/bookings', bookingsRoute); // Changed from '/routes/bookings' to '/api/bookings'
app.use('/api/admin', authenticateJWT, authorizeRoles('admin'), adminRoutes);
app.use('/api/availableTaxis', availableTaxisRoute);

// Registration Route
app.post('/register', [
    body('username').isLength({ min: 3 }).trim().escape().withMessage('Username must be at least 3 characters long'),
    body('password').isLength({ min: 5 }).trim().escape().withMessage('Password must be at least 5 characters long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, password } = req.body;
        if (await User.findOne({ username })) return res.status(400).json({ message: 'Username already exists' });

        const user = new User({ username, password });
        await user.save();

        const token = generateToken(user);
        res.status(201).json({ message: 'Registration successful', token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login Route
app.post('/login', [
    body('username').notEmpty().trim().escape().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ message: 'Login successful', token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Book Taxi Route
app.post('/bookTaxi', authenticateJWT, async (req, res) => {
    try {
        const { name, pickup, drop, date, time, taxiNo } = req.body;

        const booking = new Booking({
            userId: req.user._id,
            name,
            pickup,
            drop,
            date,
            time,
            taxiNo,
            status: 'confirmed'
        });
        await booking.save();

        res.status(201).json({
            success: true,
            redirectUrl: '/payment.html',
            booking: { name, pickup, drop, date, time, taxiNo, status: booking.status }
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ success: false, message: 'Server error during booking' });
    }
});

// Get User Trips Route
app.get('/api/trips', authenticateJWT, async (req, res) => {
    try {
        const trips = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });

        const formattedTrips = trips.map(trip => ({
            pickup: trip.pickup,
            drop: trip.drop,
            date: trip.date,
            time: trip.time,
            status: trip.status
        }));

        res.json(formattedTrips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Server error while fetching trips' });
    }
});

// 📌 Get User Details Route
app.get('/user/details', authenticateJWT, async (req, res) => {
    try {
        // Corrected from req.user.userId to req.user._id
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('🚨 Error fetching user details:', error);
        res.status(500).json({ message: 'Server error while fetching user details' });
    }
});

// Validate Token Route
app.post('/validateToken', authenticateJWT, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Use Admin Routes with Authentication and Authorization
app.use('/api/admin', authenticateJWT, authorizeRoles('admin'), adminRoutes);

// Route for Available Taxis Search
app.use('/api/availableTaxis', availableTaxisRoute);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});
app.post('/api/checkAvailability', 
    authenticateJWT, 
    availabilityValidationRules,
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    errors: errors.array() 
                });
            }

            const { pickup, drop, date, time, passengers } = req.body;

            // Convert date and time to Date object
            const bookingDateTime = new Date(`${date}T${time}`);
            const now = new Date();

            // Validate booking time is in the future
            if (bookingDateTime <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Booking time must be in the future'
                });
            }

            // Query to find available taxis
            const existingBookings = await Booking.find({
                date: date,
                time: time,
                status: { $in: ['confirmed', 'in-progress'] }
            });

            // Get all taxis
            const allTaxis = await Taxi.find({ 
                status: 'active',
                capacity: { $gte: passengers }
            });

            // Filter out taxis that are already booked for this time
            const bookedTaxiIds = existingBookings.map(booking => booking.taxiNo);
            const availableTaxis = allTaxis.filter(taxi => 
                !bookedTaxiIds.includes(taxi.taxiNo)
            );

            // Check if we have any available taxis
            const isAvailable = availableTaxis.length > 0;

            // Calculate estimated time and price
            let estimatedTime = 0;
            let estimatedPrice = 0;

            if (isAvailable) {
                // You can implement more sophisticated distance/time calculation here
                // This is a simple placeholder implementation
                estimatedTime = 30; // 30 minutes placeholder
                estimatedPrice = 500 * passengers; // Basic price calculation
            }

            res.json({
                success: true,
                available: isAvailable,
                details: {
                    availableTaxiCount: availableTaxis.length,
                    estimatedTime,
                    estimatedPrice,
                    nextAvailableSlot: !isAvailable ? findNextAvailableSlot(date, time) : null
                }
            });

        } catch (error) {
            console.error('Availability check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking availability',
                error: error.message
            });
        }
    }
);

// Helper function to find next available slot
function findNextAvailableSlot(date, time) {
    // Add 30 minutes to current time
    const [hours, minutes] = time.split(':');
    const dateObj = new Date(date);
    dateObj.setHours(parseInt(hours));
    dateObj.setMinutes(parseInt(minutes) + 30);
    
    return {
        date: dateObj.toISOString().split('T')[0],
        time: `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
    };
}


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
