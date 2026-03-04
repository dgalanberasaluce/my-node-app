const { Router } = require('express');
const healthRoutes = require('./health.routes');
const apiRoutes = require('./api.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/api', apiRoutes);

module.exports = router;
