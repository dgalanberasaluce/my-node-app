const { logger } = require('../logger');
const { NODE_ENV } = require('../config');

/**
 * Centralized error handler middleware.
 * Catches errors forwarded via next(err) from any route or middleware.
 * - Logs full stack trace internally for 5xx errors.
 * - Returns a GENERIC message to the client for 5xx in production to avoid
 *   leaking implementation details (stack traces, DB errors, etc.).
 * - Returns the original message for 4xx (expected client errors).
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    // Keep full details in internal logs only — never expose to the client.
    logger.error('unhandled error', { status, message: err.message, stack: err.stack });
  } else {
    logger.warn('client error', { status, message: err.message });
  }

  // In production, mask internal error details behind a generic message.
  const clientMessage =
    isServerError && NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(status).json({ error: clientMessage });
};

module.exports = errorHandler;
