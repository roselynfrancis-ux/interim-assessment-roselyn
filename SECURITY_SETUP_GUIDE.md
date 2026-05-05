# Security Middleware Setup Guide

## Installation

Install the additional security packages:

```bash
npm install helmet express-rate-limit morgan express-validator
```

---

## Complete Updated server.js with Security

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');

// ============ ENVIRONMENT VALIDATION ============
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ CRITICAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const app = express();

// ============ SECURITY MIDDLEWARE ============

// 1. Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// 2. Morgan - Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 3. Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. CORS with dynamic origin validation
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed.trim()))) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS rejected: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP address, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth endpoints
  skipSuccessfulRequests: true, // Only count failed requests
  message: 'Too many login attempts, please try again later.',
});

const cryptoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Allow 30 requests per minute
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/crypto', cryptoLimiter);

// 6. Request timeout
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// 7. Content-Type validation
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

// ============ DATABASE CONNECTION ============
let dbConnected = false;

connectDB()
  .then(() => {
    dbConnected = true;
    console.log('✅ Database connected successfully');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  res.status(isConnected ? 200 : 503).json({
    success: true,
    status: isConnected ? 'healthy' : 'unhealthy',
    database: isConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const httpStatus = [400, 401, 403, 404, 409, 422, 429].includes(statusCode) ? statusCode : 500;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.error(`Status: ${httpStatus}, Message: ${err.message}`);

  res.status(httpStatus).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { 
      errorDetails: {
        name: err.name,
        path: err.path,
        value: err.value,
      }
    }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
  console.log('📍 SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`${'='.repeat(50)}\n`);
});

module.exports = app;
```

---

## Environment Variables (.env file)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/coinbase-clone
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coinbase-clone

# JWT
JWT_SECRET=your_super_secure_random_secret_key_change_this_in_production
JWT_EXPIRE=7d

# CORS - comma-separated origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

# Logging
LOG_LEVEL=info
```

---

## What Each Security Measure Does

### Helmet 🎯
- Sets secure HTTP headers to prevent:
  - XSS (Cross-Site Scripting) attacks
  - Clickjacking attacks
  - MIME-sniffing
  - Content Security Policy violations

### Rate Limiting ⏱️
- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes (stricter)
- **Crypto endpoints**: 30 requests per 1 minute

### Morgan 📊
- Logs all HTTP requests
- Helps with debugging and monitoring
- Different formats for dev vs production

### CORS 🔐
- Validates request origins
- Prevents unauthorized cross-origin requests
- Only allows specified domains

### Content-Type Validation ✅
- Ensures API only accepts JSON
- Rejects malformed requests early

### Request Timeout ⏰
- Prevents hanging connections
- 30-second timeout per request

---

## Testing Security

### Test Rate Limiting
```bash
# This should fail after 5 attempts
for i in {1..10}; do curl http://localhost:5000/api/auth/login; done
```

### Test CORS
```bash
curl -H "Origin: http://unauthorized.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:5000/api/auth/register
```

### Test Content-Type Validation
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: text/plain" \
  -d "invalid"
```

---

## Monitoring Best Practices

Add process monitoring with PM2:

```bash
npm install -g pm2

pm2 start server.js --name "coinbase-api"
pm2 logs coinbase-api
pm2 monit
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters, random)
- [ ] Set realistic CORS origins (production frontend URL)
- [ ] Use MongoDB Atlas (not localhost) with credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up proper logging service (e.g., LogRocket, Sentry)
- [ ] Configure backup strategy for MongoDB
- [ ] Set up monitoring/alerting
- [ ] Use environment-specific secrets management
- [ ] Enable audit logging
