'use strict';

/**
 * SQLite database client (better-sqlite3).
 *
 * When DB_FILE=':memory:' (the default) the database lives entirely in-process
 * — no file I/O, no external server needed.  For persistent storage set
 * DB_FILE to a path, e.g. DB_FILE=./data/app.db
 *
 * The client is a singleton; call getDb() anywhere for raw Database access, or
 * use the higher-level item helpers exported below.
 *
 * Schema management note: `items` is a simple demo table.  In a real project
 * reach for a migration tool (knex, drizzle, or better-sqlite3-migrations).
 */
const path = require('path');
const { DB_FILE } = require('../config');
const { logger } = require('../logger');

let _db = null;

const getDb = () => {
  if (_db) return _db;

  const Database = require('better-sqlite3');
  const dbPath =
    DB_FILE === ':memory:' ? ':memory:' : path.resolve(process.cwd(), DB_FILE);
  _db = new Database(dbPath);

  // WAL mode for better concurrent-read throughput on file-based DBs.
  if (dbPath !== ':memory:') _db.pragma('journal_mode = WAL');

  logger.info('db: SQLite connected', {
    file: dbPath === ':memory:' ? ':memory:' : dbPath,
  });

  // ── Schema bootstrap ──────────────────────────────────────────────────
  // `items` table demonstrates CRUD in the example endpoints.
  _db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      value      TEXT,
      meta       TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return _db;
};

// ── Higher-level helpers ───────────────────────────────────────────────────

const findAllItems = () =>
  getDb()
    .prepare('SELECT * FROM items ORDER BY created_at DESC')
    .all();

const findItemById = (id) =>
  getDb().prepare('SELECT * FROM items WHERE id = ?').get(id) || null;

const createItem = ({ id, name, value = null, meta = null }) => {
  const now = new Date().toISOString();
  const metaStr = meta != null && typeof meta === 'object'
    ? JSON.stringify(meta)
    : meta;
  getDb()
    .prepare(
      'INSERT INTO items (id, name, value, meta, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(id, name, value, metaStr, now, now);
  return findItemById(id);
};

const updateItem = (id, { name, value, meta } = {}) => {
  const item = findItemById(id);
  if (!item) return null;
  const now = new Date().toISOString();
  const next = {
    name: name !== undefined ? name : item.name,
    value: value !== undefined ? value : item.value,
    meta:
      meta !== undefined
        ? typeof meta === 'object'
          ? JSON.stringify(meta)
          : meta
        : item.meta,
  };
  getDb()
    .prepare(
      'UPDATE items SET name = ?, value = ?, meta = ?, updated_at = ? WHERE id = ?',
    )
    .run(next.name, next.value, next.meta, now, id);
  return findItemById(id);
};

const deleteItem = (id) => {
  const item = findItemById(id);
  if (!item) return null;
  getDb().prepare('DELETE FROM items WHERE id = ?').run(id);
  return item;
};

module.exports = {
  getDb,
  findAllItems,
  findItemById,
  createItem,
  updateItem,
  deleteItem,
};
