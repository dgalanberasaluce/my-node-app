'use strict';

/**
 * Example controller.
 *
 * Demonstrates how the typical building blocks of a Node.js API are wired:
 *
 *   Public endpoints       — no auth required
 *   Protected endpoints    — JWT authenticate middleware enforced
 *   Cache operations       — via cache.service (ioredis / RedisMock)
 *   Database CRUD          — via db.client (SQLite / better-sqlite3)
 *   Message publishing     — via messageBroker (RabbitMQ | Kafka | mock)
 *
 * All external dependencies can be swapped for in-process mocks by setting
 * USE_MOCKS=true (or leaving it at the default in development).
 */
const { v4: uuidv4 } = require('uuid');
const cache = require('../services/cache.service');
const db = require('../services/db.client');
const broker = require('../services/messageBroker');
const { logger } = require('../logger');

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /example/public
 *
 * Health-style ping. Shows the correlation-ID that requestLogger attaches to
 * every request so log lines can be traced back to a single HTTP call.
 */
const ping = (_req, res) => {
  res.json({
    message: 'Hello from the example API!',
    correlationId: res.getHeader('x-correlation-id'),
    timestamp: new Date().toISOString(),
  });
};

// ── Protected (JWT required) ─────────────────────────────────────────────────

/**
 * GET /example/protected
 *
 * Returns the decoded JWT claims that the authenticate middleware attached to
 * req.user.  Shows how downstream handlers consume auth context.
 */
const whoAmI = (req, res) => {
  res.json({
    message: 'You are authenticated',
    user: req.user,
    correlationId: res.getHeader('x-correlation-id'),
  });
};

// ── Cache (Redis) ─────────────────────────────────────────────────────────────

/**
 * POST /example/cache
 * Body: { key: string, value: any, ttl?: number }
 */
const cacheSet = async (req, res, next) => {
  try {
    const { key, value, ttl = 60 } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: '`key` and `value` are required' });
    }
    await cache.set(key, value, parseInt(ttl, 10));
    logger.debug('cache: set key', { key, ttl });
    res.status(201).json({ ok: true, key, ttl });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /example/cache/:key
 */
const cacheGet = async (req, res, next) => {
  try {
    const value = await cache.get(req.params.key);
    if (value === null) {
      return res.status(404).json({ error: 'Cache key not found' });
    }
    res.json({ key: req.params.key, value });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /example/cache/:key
 */
const cacheDel = async (req, res, next) => {
  try {
    const deleted = await cache.del(req.params.key);
    res.json({ ok: true, deleted });
  } catch (err) {
    next(err);
  }
};

// ── Items (SQLite CRUD) ───────────────────────────────────────────────────────

/**
 * GET /example/items
 */
const listItems = (_req, res, next) => {
  try {
    res.json(db.findAllItems());
  } catch (err) {
    next(err);
  }
};

/**
 * GET /example/items/:id
 */
const getItem = (req, res, next) => {
  try {
    const item = db.findItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /example/items
 * Body: { name: string, value?: string, meta?: object }
 */
const createItem = (req, res, next) => {
  try {
    const { name, value, meta } = req.body;
    if (!name) return res.status(400).json({ error: '`name` is required' });
    const item = db.createItem({ id: uuidv4(), name, value, meta });
    logger.debug('db: item created', { id: item.id });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /example/items/:id
 * Body: { name?, value?, meta? }
 */
const updateItem = (req, res, next) => {
  try {
    const item = db.updateItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /example/items/:id
 */
const deleteItem = (req, res, next) => {
  try {
    const item = db.deleteItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true, deleted: item });
  } catch (err) {
    next(err);
  }
};

// ── Message broker ────────────────────────────────────────────────────────────

/**
 * POST /example/publish
 * Body: { topic?: string, exchange?: string, routingKey?: string, payload: any }
 *
 * Publishes a message to the configured broker (rabbitmq | kafka | mock).
 * The `id` and `publishedAt` envelope fields are added automatically.
 */
const publishMessage = async (req, res, next) => {
  try {
    const {
      topic = 'example.events',
      exchange = '',
      routingKey = 'example',
      payload,
    } = req.body;
    if (!payload) return res.status(400).json({ error: '`payload` is required' });

    const message = {
      id: uuidv4(),
      payload,
      publishedAt: new Date().toISOString(),
    };

    await broker.publish(exchange || topic, routingKey, message);
    logger.debug('broker: message published', { topic, routingKey });
    res.status(202).json({ ok: true, message });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /example/messages/:topic
 *
 * Inspect buffered messages for a topic.  Only available when using the mock
 * broker (BROKER_TYPE=mock / USE_MOCKS=true) — useful for local debugging
 * and integration tests.
 */
const getMessages = (req, res) => {
  if (typeof broker.getMessages !== 'function') {
    return res.status(501).json({
      error: 'Message inspection is only available with the mock broker (USE_MOCKS=true)',
    });
  }
  const messages = broker.getMessages(req.params.topic);
  res.json({ topic: req.params.topic, count: messages.length, messages });
};

module.exports = {
  ping,
  whoAmI,
  cacheSet,
  cacheGet,
  cacheDel,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  publishMessage,
  getMessages,
};
