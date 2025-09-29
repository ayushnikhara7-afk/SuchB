//require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const database = require('./config/database');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const blogRoutes = require('./routes/blogs');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const testVideoRoutes = require('./routes/test-videos');
const testBlogRoutes = require('./routes/test-blogs');
const { apiLimiter } = require('./middleware/rateLimiter');
const bcrypt = require('bcryptjs');

const app = express();
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


// Function to create admin user if it doesn't exist
async function createAdminUserIfNotExists() {
  try {
    const db = database.getDb();
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'admin@suchbliss.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@suchbliss.com',
      phone: '+919863779900',
      password: hashedPassword,
      role: 'admin',
      plan: 'annually',
      status: 'active',
      phoneVerified: true,
      referralCode: 'ADMIN001',
      earnings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert admin user
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@suchbliss.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5175'
  ],
  credentials: true
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test-videos', testVideoRoutes); // Test routes without authentication
app.use('/api/test-blogs', testBlogRoutes); // Test blog routes without authentication

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SuchBliss API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      videos: '/api/videos',
      blogs: '/api/blogs',
      payments: '/api/payments',
      admin: '/api/admin',
      testVideos: '/api/test-videos',
      testBlogs: '/api/test-blogs'
    }
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.get('User-Agent'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      console.error('Please set these environment variables in your deployment platform');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    // Connect to database
    await database.connect();
    
    console.log('👤 Creating admin user if needed...');
    // Create admin user if it doesn't exist
    await createAdminUserIfNotExists();
    
    console.log('🚀 Starting server...');
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Database: Connected`);
      console.log(`📡 API Routes available at: http://localhost:${PORT}/api/`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

startServer();