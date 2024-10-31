// models/Booking.js

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    pickup: { type: String, required: true, trim: true },
    drop: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    taxiNo: { type: String, trim: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
