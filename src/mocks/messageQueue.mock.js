'use strict';

/**
 * In-memory message-queue mock.
 *
 * Supports both a RabbitMQ-style API (publish / subscribe) and a Kafka-style
 * API (produce / consume) via a single shared EventEmitter.
 *
 * All published messages are appended to a ring-buffer per topic/queue so
 * tests and example endpoints can inspect what was sent.
 */
const EventEmitter = require('events');

class MessageQueueMock extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, object[]>} */
    this._messages = new Map();
    this._connected = false;
  }

  async connect() {
    this._connected = true;
    return this;
  }

  async disconnect() {
    this._connected = false;
    return this;
  }

  _store(topic, message) {
    if (!this._messages.has(topic)) this._messages.set(topic, []);
    this._messages.get(topic).push({
      ...message,
      _topic: topic,
      _timestamp: new Date().toISOString(),
    });
  }

  // ── RabbitMQ-style ──────────────────────────────────────────────────────
  async publish(exchange, routingKey, message) {
    const topic = [exchange, routingKey].filter(Boolean).join('.');
    this._store(topic, message);
    this.emit(topic, message);
    return true;
  }

  async subscribe(queue, handler) {
    this.on(queue, handler);
    return { queue, consumerTag: `mock-${queue}-${Date.now()}` };
  }

  // ── Kafka-style ─────────────────────────────────────────────────────────
  async produce(topic, message) {
    this._store(topic, message);
    this.emit(topic, message);
    return true;
  }

  async consume(topic, handler) {
    this.on(topic, handler);
    return { topic };
  }

  // ── Inspect helpers (for tests / example endpoints) ─────────────────────
  getMessages(topic) {
    return (this._messages.get(topic) || []).slice();
  }

  clearMessages(topic) {
    if (topic) {
      this._messages.delete(topic);
    } else {
      this._messages.clear();
    }
  }
}

// Singleton — all modules in the same process share one in-memory bus.
module.exports = new MessageQueueMock();
