const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middlewares/auth');
const { register, login, logout, me } = require('../controllers/auth.controller');

// Strict rate limit for auth endpoints: 10 requests / 15 min per IP.
// Protects against brute-force and credential-stuffing attacks.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
