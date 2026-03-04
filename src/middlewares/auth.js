const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { logger } = require('../logger');
const tokenBlacklistRepository = require('../repositories/tokenBlacklist.repository');

/**
 * JWT authentication middleware.
 *
 * Expects the request to carry a Bearer token in the Authorization header:
 *   Authorization: Bearer <token>
 *
 * On success, attaches the decoded payload to `req.user`, the raw token to `req.token`
 * and calls next().
 * On failure, responds with 401 when token is missing, invalid, expired, or revoked.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('auth: missing or malformed Authorization header', {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (tokenBlacklistRepository.isRevoked(token)) {
    logger.warn('auth: revoked token used', {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.token = token;
    logger.debug('auth: token verified', { sub: payload.sub, path: req.path });
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    logger.warn('auth: token verification failed', { error: err.message, path: req.path });
    return res.status(401).json({
      error: isExpired ? 'Token has expired' : 'Invalid token',
    });
  }
};

module.exports = authenticate;
