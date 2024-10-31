// models/Location.js

const mongoose = require('mongoose'); // Ensure this is only declared once

const LocationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['pickup', 'drop'], required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', LocationSchema);
