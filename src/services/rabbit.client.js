'use strict';

/**
 * RabbitMQ client adapter (amqplib).
 *
 * Exposes publish(exchange, routingKey, message) and subscribe(queue, handler)
 * so the rest of the app is shielded from amqplib's channel/connection model.
 *
 * The adapter lazily creates one shared connection + channel.  Reconnection
 * on unexpected close is handled by re-requiring this module after a delay —
 * for production use consider a dedicated reconnect library.
 */
const { RABBITMQ_URL } = require('../config');
const { logger } = require('../logger');

let _connection = null;
let _channel = null;

const _redactedUrl = RABBITMQ_URL.replace(/:\/\/.*@/, '://***@');

const connect = async () => {
  if (_channel) return _channel;

  const amqp = require('amqplib');
  _connection = await amqp.connect(RABBITMQ_URL);
  _channel = await _connection.createChannel();

  _connection.on('error', (err) =>
    logger.error('rabbitmq: connection error', { message: err.message }),
  );
  _connection.on('close', () => {
    logger.warn('rabbitmq: connection closed');
    _connection = null;
    _channel = null;
  });

  logger.info('rabbitmq: connected', { url: _redactedUrl });
  return _channel;
};

/**
 * Publish a message to an exchange (or directly to a queue if exchange='').
 * @param {string} exchange   — exchange name, or '' for default exchange
 * @param {string} routingKey — routing key / queue name
 * @param {object} message    — serialised as JSON
 */
const publish = async (exchange, routingKey, message) => {
  const ch = await connect();
  if (exchange) await ch.assertExchange(exchange, 'topic', { durable: true });
  const payload = Buffer.from(JSON.stringify(message));
  ch.publish(exchange || '', routingKey, payload, { persistent: true });
  return true;
};

/**
 * Subscribe to a queue, optionally binding it to an exchange.
 * @param {string}   queue    — queue to consume
 * @param {Function} handler  — called with the parsed message object
 * @param {object}   [opts]
 * @param {string}   [opts.exchange]   — bind to this exchange
 * @param {string}   [opts.routingKey] — binding routing key (default '#')
 */
const subscribe = async (queue, handler, { exchange = '', routingKey = '#' } = {}) => {
  const ch = await connect();
  await ch.assertQueue(queue, { durable: true });
  if (exchange) {
    await ch.assertExchange(exchange, 'topic', { durable: true });
    await ch.bindQueue(queue, exchange, routingKey);
  }
  ch.prefetch(1);
  await ch.consume(queue, (msg) => {
    if (!msg) return;
    try {
      handler(JSON.parse(msg.content.toString()));
    } catch (err) {
      logger.error('rabbitmq: message parse error', { message: err.message });
    }
    ch.ack(msg);
  });
  logger.info('rabbitmq: subscribed', { queue });
};

const disconnect = async () => {
  if (_connection) await _connection.close();
};

module.exports = { publish, subscribe, disconnect };
