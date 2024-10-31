// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the User Schema
const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username is required'], 
        unique: true, 
        trim: true, 
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'], 
        minlength: [5, 'Password must be at least 5 characters long'],
        select: false // Exclude password from query results by default
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user',
        required: [true, 'Role is required']
    }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save middleware to hash passwords before saving
UserSchema.pre('save', async function(next) {
    try {
        // Only hash the password if it has been modified or is new
        if (!this.isModified('password')) return next();

        // Generate a salt with 12 rounds
        const salt = await bcrypt.genSalt(12);

        // Hash the password using the generated salt
        const hashedPassword = await bcrypt.hash(this.password, salt);

        // Replace the plain-text password with the hashed password
        this.password = hashedPassword;

        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.comparePassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new Error('Password comparison failed');
    }
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);
