// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';


// Import routes
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import contentRoutes from './routes/contentRoutes';
import emailRoutes from './routes/emailRoutes';
import studentIdRoutes from './routes/studentIdRoutes';
import devRoutes from './routes/devRoutes';


const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Basic rate limiting to mitigate abuse
const limiter = rateLimit({ windowMs: 60 * 1000, max: 300 });
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to St. Raguel Church School Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      courses: '/api/courses'
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'St. Raguel Church School API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
try {
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/student-id', studentIdRoutes);
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    app.use('/api/dev/seed', devRoutes);
  }
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// 404 handler - catch all unmatched routes
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 St. Raguel Church School API server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
});

export default app;