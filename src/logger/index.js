const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, json, colorize, printf } = format;
const { name, version } = require('../../package.json');
const config = require('../config');

/**
 * AsyncLocalStorage used to propagate correlation IDs through the entire
 * request lifecycle without needing to pass them as function arguments.
 */
const { AsyncLocalStorage } = require('async_hooks');
const requestContext = new AsyncLocalStorage();

/**
 * Custom format that injects the correlation ID stored in AsyncLocalStorage
 * into every log entry — critical for distributed tracing in microservices.
 */
const correlationId = format((info) => {
  const store = requestContext.getStore();
  info.correlationId = (store && store.correlationId) || '-';
  return info;
});

const baseMetadata = format((info) => {
  info.service = name;
  info.version = version;
  info.environment = config.NODE_ENV;
  return info;
});

/**
 * Human-readable format for local development.
 */
const devFormat = combine(
  colorize(),
  printf(({ level, message, correlationId, timestamp, ...meta }) => {
    const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${correlationId}] ${level}: ${message}${extras}`;
  }),
);

/**
 * Structured JSON format for production (consumed by log aggregators like
 * Datadog, Loki, CloudWatch, etc.).
 */
const prodFormat = combine(json());

const logger = createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    errors({ stack: true }),
    correlationId(),
    baseMetadata(),
    config.NODE_ENV === 'production' ? prodFormat : devFormat,
  ),
  transports: [new transports.Console()],
  // Prevent winston from exiting on unhandled errors in transports.
  exitOnError: false,
});

module.exports = { logger, requestContext };
