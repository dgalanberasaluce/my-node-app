/**
 * API controller
 * Responsibility: handle business logic for /api endpoints.
 */

const hello = (req, res) => {
  res.json({ message: 'Hello from Express!' });
};

const echo = (req, res) => {
  res.json({ received: req.body });
};

module.exports = { hello, echo };
