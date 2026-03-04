'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const {
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
} = require('../controllers/example.controller');

const router = Router();

// ── Public (no auth) ─────────────────────────────────────────────────────────
// GET /example/public
router.get('/public', ping);

// ── Protected (JWT required) ─────────────────────────────────────────────────
// GET /example/protected
router.get('/protected', authenticate, whoAmI);

// ── Cache (Redis) ─────────────────────────────────────────────────────────────
// POST   /example/cache          { key, value, ttl? }
// GET    /example/cache/:key
// DELETE /example/cache/:key
router.post('/cache', authenticate, cacheSet);
router.get('/cache/:key', authenticate, cacheGet);
router.delete('/cache/:key', authenticate, cacheDel);

// ── Items (SQLite CRUD) ───────────────────────────────────────────────────────
// GET    /example/items
// GET    /example/items/:id
// POST   /example/items          { name, value?, meta? }
// PATCH  /example/items/:id      { name?, value?, meta? }
// DELETE /example/items/:id
router.get('/items', authenticate, listItems);
router.get('/items/:id', authenticate, getItem);
router.post('/items', authenticate, createItem);
router.patch('/items/:id', authenticate, updateItem);
router.delete('/items/:id', authenticate, deleteItem);

// ── Message broker ────────────────────────────────────────────────────────────
// POST /example/publish          { topic?, exchange?, routingKey?, payload }
// GET  /example/messages/:topic  (mock-only: inspect buffered messages)
router.post('/publish', authenticate, publishMessage);
router.get('/messages/:topic', authenticate, getMessages);

module.exports = router;
