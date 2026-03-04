const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const { register, login, logout, me } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
