/**
 * Centralized error handler middleware.
 * Catches errors forwarded via next(err) from any route or middleware.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
