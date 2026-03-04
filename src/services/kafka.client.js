'use strict';

/**
 * Kafka client adapter (kafkajs).
 *
 * Exposes produce(topic, message) and consume(topic, handler) so the rest of
 * the app is shielded from kafkajs' producer/consumer model.
 *
 * One producer is lazily connected and shared.  Each topic gets its own
 * consumer group (groupId defaults to "<clientId>-<topic>").
 */
const { KAFKA_BROKERS, KAFKA_CLIENT_ID } = require('../config');
const { logger } = require('../logger');

let _kafka = null;
let _producer = null;
/** @type {Map<string, import('kafkajs').Consumer>} */
const _consumers = new Map();

const getKafka = () => {
  if (_kafka) return _kafka;
  const { Kafka, logLevel } = require('kafkajs');
  _kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: KAFKA_BROKERS,
    // Bridge kafkajs logs into our winston logger.
    logCreator: () => ({ namespace, level, log: { message } }) => {
      const lvl = level <= 1 ? 'error' : level === 2 ? 'warn' : 'debug';
      logger[lvl](`kafkajs [${namespace}]: ${message}`);
    },
  });
  return _kafka;
};

const getProducer = async () => {
  if (_producer) return _producer;
  _producer = getKafka().producer();
  await _producer.connect();
  logger.info('kafka: producer connected', { brokers: KAFKA_BROKERS });
  return _producer;
};

/**
 * Send a message to a Kafka topic.
 * @param {string} topic
 * @param {object} message — serialised as JSON
 */
const produce = async (topic, message) => {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  return true;
};

/**
 * Consume messages from a Kafka topic.
 * @param {string}   topic
 * @param {Function} handler   — called with the parsed message object
 * @param {object}   [opts]
 * @param {string}   [opts.groupId]   — consumer group ID
 */
const consume = async (topic, handler, { groupId } = {}) => {
  if (_consumers.has(topic)) return; // already subscribed

  const effectiveGroupId = groupId || `${KAFKA_CLIENT_ID}-${topic}`;
  const consumer = getKafka().consumer({ groupId: effectiveGroupId });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        handler(JSON.parse(message.value.toString()));
      } catch (err) {
        logger.error('kafka: message parse error', { message: err.message });
      }
    },
  });
  _consumers.set(topic, consumer);
  logger.info('kafka: consumer running', { topic, groupId: effectiveGroupId });
};

const disconnect = async () => {
  if (_producer) await _producer.disconnect();
  for (const consumer of _consumers.values()) await consumer.disconnect();
};

module.exports = { produce, consume, disconnect };
