const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiRateLimiter } = require('./middleware/rateLimit');

const chatRoutes = require('./routes/chat');
const newsRoutes = require('./routes/news');
const boothsRoutes = require('./routes/booths');
const timelineRoutes = require('./routes/timeline');

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Security headers configuration.
 * Uses Helmet to set HTTP headers securely while allowing necessary third-party scripts.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:", "data:", "blob:", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrc: ["'self'", "https:", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

/**
 * CORS Configuration.
 * Restricts cross-origin requests to trusted domains.
 */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://electvoice-121882130979.us-central1.run.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or if origin matches our trusted list/Cloud Run domain
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));

// Apply rate limiting to all /api routes
app.use('/api', apiRateLimiter);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/booths', boothsRoutes);
app.use('/api/timeline', timelineRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  // Fallback to React Router for all other routes
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // 404 handler for API routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, req, res, _next) => {
  const statusCode = err.status || 500;
  console.error('[Error]', err.message, err.stack);
  res.status(statusCode).json({ error: err.message || 'Internal server error' });
});

// Only start listening when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ElectVoice server running on port ${PORT}`);
  });
}

module.exports = app;
