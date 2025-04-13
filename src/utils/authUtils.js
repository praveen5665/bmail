// Import jsonwebtoken conditionally
let jwt;
if (typeof window === 'undefined') {
  // Server-side only
  jwt = require('jsonwebtoken');
}

import connectToDatabase from './mongoConnect';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token - server-side only
export function generateToken(user) {
  if (typeof window !== 'undefined') {
    throw new Error('Token generation can only be done on the server');
  }
  
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      ethAddress: user.ethAddress
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token - server-side only
export function verifyToken(token) {
  if (typeof window !== 'undefined') {
    throw new Error('Token verification can only be done on the server');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Register a new user
export async function registerUser({ name, email, password, ethAddress, publicKey }) {
  if (typeof window !== 'undefined') {
    throw new Error('User registration must be handled by API routes on the server');
  }
  
  await connectToDatabase();
  
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already exists');
  }
  
  // Check if wallet address already exists
  const existingWallet = await User.findOne({ ethAddress });
  if (existingWallet) {
    throw new Error('Wallet address already in use');
  }
  
  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    ethAddress,
    publicKey
  });
  
  // Generate token
  const token = generateToken(user);
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      ethAddress: user.ethAddress
    },
    token
  };
}

// Login a user
export async function loginUser({ email, password }) {
  if (typeof window !== 'undefined') {
    throw new Error('User login must be handled by API routes on the server');
  }
  
  await connectToDatabase();
  
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token
  const token = generateToken(user);
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      ethAddress: user.ethAddress
    },
    token
  };
}

// Get user by ID
export async function getUserById(id) {
  if (typeof window !== 'undefined') {
    throw new Error('User retrieval must be handled by API routes on the server');
  }
  
  await connectToDatabase();
  
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    ethAddress: user.ethAddress,
    publicKey: user.publicKey
  };
}

// Get user public key by email or wallet address
export async function getUserPublicKey(emailOrAddress) {
  if (typeof window !== 'undefined') {
    throw new Error('Public key lookup must be handled by API routes on the server');
  }
  
  await connectToDatabase();
  
  let query = {};
  
  if (emailOrAddress.includes('@')) {
    query.email = emailOrAddress.toLowerCase();
  } else if (emailOrAddress.startsWith('0x')) {
    query.ethAddress = emailOrAddress;
  } else {
    throw new Error('Invalid email or wallet address format');
  }
  
  const user = await User.findOne(query).select('publicKey');
  if (!user) {
    throw new Error('User not found');
  }
  
  return user.publicKey;
} 