/**
 * API controller
 * Responsibility: handle business logic for /api endpoints.
 */

const hello = (req, res) => {
  res.json({ message: 'Hello from Express!' });
};

/**
 * Echo endpoint — only available outside production.
 * Reflecting arbitrary input in production is a security anti-pattern
 * (facilitates probing and may trigger client-side issues).
 */
const echo = (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.json({ received: req.body });
};

module.exports = { hello, echo };
