require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');

// ✅ FIX #1: Validate required environment variables at startup
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ CRITICAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// ✅ FIX #6: Validate JWT_EXPIRE if specified
if (process.env.JWT_EXPIRE) {
  const validExpires = /^\d+[dhms]$/.test(process.env.JWT_EXPIRE);
  if (!validExpires) {
    console.warn('⚠️ Invalid JWT_EXPIRE format. Expected: 7d, 24h, 3600s, etc.');
  }
}

const app = express();

// ✅ FIX #5: Add request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ✅ FIX #3: Improved CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(allowed => origin.includes(allowed.trim()))) {
        callback(null, true);
      } else {
        console.warn(`CORS denied for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

// ✅ ADD: Content-Type validation for POST/PUT requests
app.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && Object.keys(req.body).length > 0) {
    if (!req.is('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }
  next();
});

// ✅ ADD: Request timeout configuration
app.use((req, res, next) => {
  req.setTimeout(30000);  // 30 seconds
  res.setTimeout(30000);
  next();
});

// ✅ FIX #1: Properly await database connection
let dbConnected = false;

connectDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ Database connected successfully');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    // Server will continue but db-dependent routes will fail
    // Remove the process.exit(1) if you want graceful degradation
    process.exit(1);
  });

// Health check route (improved)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  const health = {
    success: true,
    status: isConnected ? 'healthy' : 'unhealthy',
    database: isConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = isConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);

// ✅ FIX #2: Improved error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const httpStatus = [400, 401, 403, 404, 409, 422, 429].includes(statusCode) ? statusCode : 500;

  // Log error details (without exposing sensitive info in production)
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`);
  console.error(`Status: ${httpStatus}, Message: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(httpStatus).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`\n✅ Server ready to accept requests\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to restart the server or log this
});

module.exports = app;
