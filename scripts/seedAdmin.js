// scripts/seedAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// User Schema with Role
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    password: { type: String, required: true, minlength: 5 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Added role field
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taxi-booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
});

// Seed Admin User Function
const seedAdminUser = async () => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
            console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
            process.exit(1);
        }

        const existingAdmin = await User.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = new User({
            username: adminUsername,
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

// Execute the Seed Function
seedAdminUser();
