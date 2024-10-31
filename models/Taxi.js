// models/Taxi.js

const mongoose = require('mongoose'); 

const TaxiSchema = new mongoose.Schema({
    vehicleModel: { type: String, required: true },
    licensePlate: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    // Add 'booked' as a valid enum value for the status field
    status: { 
        type: String, 
        enum: ['available', 'unavailable', 'booked'], // Added 'booked' to the enum
        default: 'available' 
    },
    sourceLocation: { type: String, required: true },
    destinationLocation: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Taxi', TaxiSchema);
