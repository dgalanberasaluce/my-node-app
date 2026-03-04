'use strict';

/**
 * Message-broker abstraction — picks the right adapter at startup.
 *
 * BROKER_TYPE / USE_MOCKS → adapter
 * ─────────────────────────────────
 *  USE_MOCKS=true          → in-memory mock  (no external server needed)
 *  BROKER_TYPE=mock        → in-memory mock
 *  BROKER_TYPE=rabbitmq    → amqplib adapter
 *  BROKER_TYPE=kafka       → kafkajs adapter
 *
 * All adapters share the same surface:
 *
 *   publish(exchange|topic, routingKey|null, message) → Promise<true>
 *   subscribe(queue|topic, handler)                   → Promise<{...}>
 *
 * The Kafka adapter additionally exposes produce() / consume() if you prefer
 * that naming convention.
 */
const { BROKER_TYPE, USE_MOCKS } = require('../config');
const { logger } = require('../logger');

const effectiveBroker = USE_MOCKS ? 'mock' : BROKER_TYPE;
logger.info('messageBroker: loaded adapter', { broker: effectiveBroker });

let adapter;
switch (effectiveBroker) {
  case 'rabbitmq':
    adapter = require('./rabbit.client');
    break;
  case 'kafka':
    adapter = require('./kafka.client');
    break;
  case 'mock':
  default:
    adapter = require('../mocks/messageQueue.mock');
    break;
}

module.exports = adapter;
