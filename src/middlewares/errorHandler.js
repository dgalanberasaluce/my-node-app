const { logger } = require('../logger');

/**
 * Centralized error handler middleware.
 * Catches errors forwarded via next(err) from any route or middleware.
 * Logs full stack trace for 5xx errors, brief message for 4xx.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    logger.error('unhandled error', { status, message, stack: err.stack });
  } else {
    logger.warn('client error', { status, message });
  }

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
