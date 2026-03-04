'use strict';

/**
 * Cache service — thin façade over ioredis (real) or RedisMock (local/test).
 *
 * The client is chosen once at startup based on config:
 *   USE_MOCKS=true or no REDIS_URL  →  in-memory mock (no server needed)
 *   REDIS_URL set                    →  real ioredis connection
 *
 * Usage:
 *   const cache = require('./cache.service');
 *   await cache.set('key', 'value', 60);   // ttl in seconds (optional)
 *   const val = await cache.get('key');
 */
const { REDIS_URL, USE_MOCKS } = require('../config');
const { logger } = require('../logger');

let _client = null;

const getClient = () => {
  if (_client) return _client;

  if (USE_MOCKS || !REDIS_URL) {
    const RedisMock = require('../mocks/redis.mock');
    _client = new RedisMock();
    logger.info('cache: using in-memory mock (no Redis server required)');
  } else {
    const Redis = require('ioredis');
    _client = new Redis(REDIS_URL, { lazyConnect: false, enableReadyCheck: true });
    _client.on('error', (err) =>
      logger.error('cache: Redis error', { message: err.message }),
    );
    _client.on('ready', () =>
      logger.info('cache: Redis connected', { url: REDIS_URL }),
    );
  }

  return _client;
};

/**
 * @param {string} key
 * @returns {Promise<string|null>}
 */
const get = (key) => getClient().get(key);

/**
 * @param {string} key
 * @param {string|object} value  — objects are JSON-serialized automatically
 * @param {number} [ttlSeconds]
 */
const set = (key, value, ttlSeconds = null) => {
  const serialized =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (ttlSeconds) {
    return getClient().set(key, serialized, 'EX', ttlSeconds);
  }
  return getClient().set(key, serialized);
};

const del = (key) => getClient().del(key);
const exists = (key) => getClient().exists(key);
const incr = (key) => getClient().incr(key);
const keys = (pattern) => getClient().keys(pattern);

module.exports = { get, set, del, exists, incr, keys, getClient };
