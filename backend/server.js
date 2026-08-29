require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');

const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const errorHandler = require('./src/middleware/errorHandler');
const activityLogger = require('./src/middleware/activityLogger');
const { initSocket } = require('./src/services/socketService');

// Route imports
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const interviewRoutes = require('./src/routes/interviews');
const aiAgentInterviewRoutes = require('./src/routes/aiAgentInterviews');
const teamInterviewRoutes = require('./src/routes/teamInterviews');
const interviewerRoutes = require('./src/routes/interviewer');
const notificationRoutes = require('./src/routes/notifications');
const jobRoutes = require('./src/routes/jobs');
const adminRoutes = require('./src/routes/admin');
const messageRoutes = require('./src/routes/messages');
const contestRoutes = require('./src/routes/contests');
const reportRoutes = require('./src/routes/reports');
const practiceRoutes = require('./src/routes/practice');
const multiplayerRoutes = require('./src/routes/multiplayer');
const trackerRoutes = require('./src/routes/tracker');

// Connect DB and start notification scheduler
const { startNotificationScheduler } = require('./src/services/notificationService');
(async () => {
  await connectDB();
  startNotificationScheduler();
})();

// Create logs dir
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Create uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration (supports single URL, multiple comma-separated URLs, and wildcards)
const getAllowedOrigins = () => {
  const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaults = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  return Array.from(new Set([...envOrigins, ...defaults]));
};

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, desktop tracker, curl, postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      // Check for wildcard subdomains or origin match
      const matched = allowedOrigins.some((allowed) => {
        if (allowed === origin) return true;
        if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(2))) return true;
        return false;
      });

      if (matched) return callback(null, true);

      // Fallback: log warning and permit origin to prevent rigid deployment breakage
      logger.warn(`CORS request from unlisted origin: ${origin}`);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Activity logging (for authenticated routes)
app.use(activityLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/interviews/ai-agent', aiAgentInterviewRoutes);
app.use('/api/team-interviews', teamInterviewRoutes);
app.use('/api/interviewer', interviewerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/multiplayer', multiplayerRoutes);
app.use('/api/tracker', trackerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Hiring Platform API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build if present (for single-server / monolithic deployment)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize real-time Socket.IO
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode (HTTP + WebSocket)`);
});

// Handle unhandled promise rejections & uncaught exceptions gracefully
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err?.stack || err?.message || err}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err?.stack || err?.message || err}`);
});

module.exports = { app, server };
