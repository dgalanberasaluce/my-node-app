const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

/**
 * Factory function that creates and configures the Express application.
 * Keeps app setup separate from server startup (improves testability).
 */
const createApp = () => {
  const app = express();

  // Security headers (CSP, X-Frame-Options, HSTS, etc.)
  app.use(helmet());

  // CORS — by default only same-origin; set CORS_ORIGIN env var to relax.
  app.use(cors({
    origin: process.env.CORS_ORIGIN || false,
    credentials: true,
  }));

  // Global rate limit: 200 req / 15 min per IP.
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }));

  // Body parsing with an explicit size cap to prevent payload-based DoS.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Structured HTTP request logging + correlation ID injection
  app.use(requestLogger);

  // Routes
  app.use(routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
