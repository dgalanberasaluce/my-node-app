const express = require('express');
const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

/**
 * Factory function that creates and configures the Express application.
 * Keeps app setup separate from server startup (improves testability).
 */
const createApp = () => {
  const app = express();

  // Built-in middleware
  app.use(express.json());

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
