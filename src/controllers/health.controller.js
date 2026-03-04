/**
 * Health controller
 * Responsibility: return basic server health information.
 */

const healthCheck = (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

module.exports = { healthCheck };
