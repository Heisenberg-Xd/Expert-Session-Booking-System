// config/db.js - MongoDB connection with proper error handling and retry logic
const mongoose = require('mongoose');

/**
 * Establishes MongoDB connection with reconnection support.
 * Uses mongoose's built-in connection pooling for production scale.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These settings optimize for production stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events for observability
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Fatal: cannot run without DB
  }
};

module.exports = connectDB;
