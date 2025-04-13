// Conditionally import mongoose only on the server side
let mongoose;
if (typeof window === 'undefined') {
  // This code only runs on the server
  mongoose = require('mongoose');
}

// Conditionally import bcrypt only on server side
let bcrypt;
if (typeof window === 'undefined') {
  // This code only runs on the server
  bcrypt = require('bcrypt');
}

// Create schema only on server
const UserSchema = typeof window === 'undefined' ? new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/@bmail\.com$/, 'Email must end with @bmail.com']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  ethAddress: {
    type: String,
    required: [true, 'Ethereum address is required'],
    unique: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address']
  },
  publicKey: {
    type: String,
    required: [true, 'Public key is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
}) : null;

// Only add methods if we're on the server
if (typeof window === 'undefined' && UserSchema) {
  // Hash password before saving - only runs on server
  UserSchema.pre('save', async function(next) {
    // Skip if password not modified
    if (!this.isModified('password')) {
      return next();
    }
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Method to check password validity - only works on server
  UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw error;
    }
  };
}

// Create model only if we're on the server and it doesn't exist already
const User = typeof window === 'undefined' 
  ? (mongoose.models.User || mongoose.model('User', UserSchema))
  : {};

export default User; 