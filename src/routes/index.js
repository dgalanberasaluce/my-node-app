const { Router } = require('express');
const healthRoutes = require('./health.routes');
const apiRoutes = require('./api.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/api', apiRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
