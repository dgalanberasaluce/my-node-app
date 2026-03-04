const { v4: uuidv4 } = require('uuid');
const { logger, requestContext } = require('../logger');

// Fields that must never appear in plaintext in logs.
const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'access_token', 'refresh_token', 'secret', 'api_key', 'apikey']);

/**
 * Recursively replaces values whose key matches SENSITIVE_KEYS with '[REDACTED]'.
 */
const redactSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v,
    ])
  );
};

/**
 * Request Logger middleware — microservices best practices:
 *  - Assigns a unique correlation ID to every incoming request.
 *  - Stores it in AsyncLocalStorage so all downstream logs include it.
 *  - Exposes it in the X-Correlation-Id response header for client tracing.
 *  - Logs structured request/response metadata (method, path, status, ms).
 *  - Uses high-resolution timer for accurate duration measurement.
 *  - Redacts sensitive query parameters to prevent PII leaking into logs.
 */
const requestLogger = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const startAt = process.hrtime.bigint();

  // Expose correlation ID to the caller.
  res.setHeader('x-correlation-id', correlationId);

  // Run the rest of the request lifecycle inside the async context so every
  // log call made during this request automatically gets the correlation ID.
  requestContext.run({ correlationId }, () => {
    logger.http('incoming request', {
      method: req.method,
      path: req.path,
      query: redactSensitive(req.query),
      ip: req.ip,
    });

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

      logger[level]('request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: parseFloat(durationMs.toFixed(3)),
      });
    });

    next();
  });
};

module.exports = requestLogger;
