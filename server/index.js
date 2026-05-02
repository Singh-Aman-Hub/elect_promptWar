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

// Security headers
app.use(helmet());

// CORS — only allow configured frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  const statusCode = err.status || 500;
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err.message);
  }
  res.status(statusCode).json({ error: err.message || 'Internal server error' });
});

// Only start listening when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ElectVoice server running on port ${PORT}`);
  });
}

module.exports = app;
