'use strict';

/**
 * In-memory mock that implements the subset of ioredis used in this project.
 * Safe to use in development and tests — no Redis server required.
 */
const EventEmitter = require('events');

class RedisMock extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, { value: string, expiresAt: number|null }>} */
    this._store = new Map();
    // Emit 'ready' async so callers can attach listeners first.
    setImmediate(() => this.emit('ready'));
  }

  _isExpired(entry) {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  _getEntry(key) {
    const entry = this._store.get(key);
    if (!entry || this._isExpired(entry)) {
      this._store.delete(key);
      return null;
    }
    return entry;
  }

  async get(key) {
    const entry = this._getEntry(key);
    return entry ? entry.value : null;
  }

  /**
   * set(key, value, ['EX', seconds] | ['PX', ms])
   */
  async set(key, value, ...args) {
    let expiresAt = null;
    for (let i = 0; i < args.length; i++) {
      const opt = String(args[i]).toUpperCase();
      if (opt === 'EX' && args[i + 1] != null) {
        expiresAt = Date.now() + Number(args[i + 1]) * 1000;
        i++;
      } else if (opt === 'PX' && args[i + 1] != null) {
        expiresAt = Date.now() + Number(args[i + 1]);
        i++;
      }
    }
    this._store.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async setex(key, ttlSeconds, value) {
    return this.set(key, value, 'EX', ttlSeconds);
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this._store.delete(key)) count++;
    }
    return count;
  }

  async exists(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this._getEntry(key) !== null) count++;
    }
    return count;
  }

  async expire(key, ttlSeconds) {
    const entry = this._getEntry(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return 1;
  }

  async ttl(key) {
    const entry = this._getEntry(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async incr(key) {
    const entry = this._getEntry(key);
    const current = entry ? parseInt(entry.value, 10) : 0;
    const next = (isNaN(current) ? 0 : current) + 1;
    if (entry) {
      entry.value = String(next);
    } else {
      this._store.set(key, { value: String(next), expiresAt: null });
    }
    return next;
  }

  async keys(pattern) {
    // Minimal glob: only '*' wildcard supported.
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    const result = [];
    for (const [key, entry] of this._store.entries()) {
      if (!this._isExpired(entry) && regex.test(key)) result.push(key);
    }
    return result;
  }

  async flushall() {
    this._store.clear();
    return 'OK';
  }

  async ping() {
    return 'PONG';
  }
}

module.exports = RedisMock;
