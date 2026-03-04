const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

// Fail fast in production: a weak default secret must never be used in production.
if (!process.env.JWT_SECRET && NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_ISSUER = process.env.JWT_ISSUER || 'my-node-app';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'my-node-app-users';

// Optional Redis URL for shared token blacklist (required in multi-instance deployments).
const REDIS_URL = process.env.REDIS_URL || null;

// Configurable bcrypt cost factor (higher = slower = more secure).
const PASSWORD_SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10);

module.exports = { PORT, NODE_ENV, LOG_LEVEL, JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE, REDIS_URL, PASSWORD_SALT_ROUNDS };
