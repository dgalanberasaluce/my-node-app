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

// ─── Example-API extras ─────────────────────────────────────────────────────
// When USE_MOCKS=true all external services (DB, Redis, brokers) are replaced
// with lightweight in-process mocks — no Docker or external server is needed.
const USE_MOCKS = process.env.USE_MOCKS === 'true' || NODE_ENV === 'test';

// SQLite file path (relative or absolute). ':memory:' = in-process, ephemeral.
const DB_FILE = process.env.DB_FILE || ':memory:';

// Message broker: 'rabbitmq' | 'kafka' | 'mock' (default when USE_MOCKS)
const BROKER_TYPE = process.env.BROKER_TYPE || (USE_MOCKS ? 'mock' : 'rabbitmq');

// RabbitMQ
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

// Kafka — comma-separated list of broker host:port
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map((s) => s.trim());
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'my-node-app';

module.exports = {
  PORT, NODE_ENV, LOG_LEVEL,
  JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE,
  REDIS_URL, PASSWORD_SALT_ROUNDS,
  USE_MOCKS, DB_FILE, BROKER_TYPE,
  RABBITMQ_URL, KAFKA_BROKERS, KAFKA_CLIENT_ID,
};
