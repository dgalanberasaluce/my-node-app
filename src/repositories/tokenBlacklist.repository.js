/**
 * Token blacklist repository.
 *
 * Uses Redis (via REDIS_URL) when available — required for multi-instance deployments
 * so that revoked tokens are shared across all processes.
 * Falls back to an in-process Map for local development / single-instance setups.
 *
 * Both `revoke` and `isRevoked` are async to allow transparent use of either backend.
 */
const { REDIS_URL } = require('../config');

// ---------------------------------------------------------------------------
// In-memory fallback (dev / single-instance only)
// ---------------------------------------------------------------------------
const _mem = new Map();

const _memPurge = () => {
  const now = Date.now();
  for (const [token, expiresAt] of _mem.entries()) {
    if (expiresAt <= now) _mem.delete(token);
  }
};

const _memRevoke = (token, expiresAt) => { _memPurge(); _mem.set(token, expiresAt); };
const _memIsRevoked = (token) => { _memPurge(); return _mem.has(token); };

// ---------------------------------------------------------------------------
// Redis backend (shared, production-grade)
// ---------------------------------------------------------------------------
let _redis = null;

if (REDIS_URL) {
  // ioredis is an optional peer-dep; only required when REDIS_URL is set.
  // eslint-disable-next-line global-require
  const Redis = require('ioredis');
  _redis = new Redis(REDIS_URL, { lazyConnect: false, enableReadyCheck: true });
  _redis.on('error', (err) => {
    // Log but do NOT crash — the app can still run with degraded revocation.
    // eslint-disable-next-line no-console
    console.error('[tokenBlacklist] Redis error:', err.message);
  });
}

// ---------------------------------------------------------------------------
// Public API (async)
// ---------------------------------------------------------------------------
const REDIS_KEY = (token) => `blacklist:${token}`;

/**
 * Revoke a token until `expiresAt` (Unix ms).
 */
const revoke = async (token, expiresAt) => {
  if (_redis) {
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
    await _redis.set(REDIS_KEY(token), '1', 'EX', ttlSeconds);
  } else {
    _memRevoke(token, expiresAt);
  }
};

/**
 * Returns true if the token has been revoked.
 */
const isRevoked = async (token) => {
  if (_redis) {
    const result = await _redis.exists(REDIS_KEY(token));
    return result === 1;
  }
  return _memIsRevoked(token);
};

module.exports = { revoke, isRevoked };
