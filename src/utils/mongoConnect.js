// Conditionally import mongoose only on the server side
let mongoose;
if (typeof window === 'undefined') {
  // Server-side only
  mongoose = require('mongoose');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bmail';

// Cache the MongoDB connection to prevent multiple connections in development
let cached = global.mongoose;

if (typeof window === 'undefined' && !cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  // Only allow connection on the server
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB connections can only be made on the server');
  }
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch(error => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase; 